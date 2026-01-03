import json
import os
import pathlib
import shutil
import subprocess
import tempfile
import time

from flask import Flask, jsonify, request
from google.cloud import storage


def _env_int(name: str, default: int) -> int:
    value = os.environ.get(name, "").strip()
    if not value:
        return default
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except Exception:
        return default


def _fail(status: int, message: str, details: str | None = None):
    payload: dict = {"ok": False, "error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status


def _normalize_prefix(value: str) -> str:
    prefix = value.strip()
    if not prefix:
        return "models/"
    return prefix if prefix.endswith("/") else f"{prefix}/"


USDZ_CONVERTER_TOKEN = os.environ.get("USDZ_CONVERTER_TOKEN", "").strip()
LABELCOM_STORAGE_BUCKET = os.environ.get("LABELCOM_STORAGE_BUCKET", "").strip()
LABELCOM_MODEL_PREFIX = _normalize_prefix(os.environ.get("LABELCOM_MODEL_PREFIX", "models/"))

BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender").strip()
BLENDER_SCRIPT = os.environ.get("BLENDER_USDZ_SCRIPT", "/app/convert_glb_to_usdz.py").strip()

CONVERT_TIMEOUT_MS = _env_int("USDZ_CONVERTER_TIMEOUT_MS", 240_000)
TARGET_USDZ_MAX_BYTES = _env_int("LABELCOM_TARGET_USDZ_MAX_BYTES", 80 * 1024 * 1024)

if not LABELCOM_STORAGE_BUCKET:
    raise RuntimeError("Missing required env var LABELCOM_STORAGE_BUCKET")

app = Flask(__name__)
storage_client = storage.Client()


def _check_auth() -> bool:
    if not USDZ_CONVERTER_TOKEN:
        return True
    token = request.headers.get("x-labelcom-token", "").strip()
    return token == USDZ_CONVERTER_TOKEN


def _is_safe_object_path(value: str, suffix: str) -> bool:
    if not value:
        return False
    if "\\" in value or ".." in value:
        return False
    if not value.startswith(LABELCOM_MODEL_PREFIX):
        return False
    return value.endswith(suffix)


@app.get("/healthz")
def healthz():
    return jsonify({"ok": True})


@app.post("/convert")
def convert():
    if not _check_auth():
        return _fail(403, "Unauthorized")

    try:
        payload = request.get_json(force=True, silent=False)
    except Exception:
        return _fail(400, "Invalid JSON")

    bucket_name = str(payload.get("bucket", "")).strip()
    object_id = str(payload.get("objectId", "")).strip()
    optimized_path = str(payload.get("optimizedPath", "")).strip()
    usdz_path = str(payload.get("usdzPath", "")).strip()

    if bucket_name != LABELCOM_STORAGE_BUCKET:
        return _fail(400, "Invalid bucket")

    if not object_id:
        return _fail(400, "Missing objectId")

    if not _is_safe_object_path(optimized_path, ".glb"):
        return _fail(400, "Invalid optimizedPath")

    if not _is_safe_object_path(usdz_path, ".usdz"):
        return _fail(400, "Invalid usdzPath")

    start_ms = int(time.time() * 1000)
    tmp_dir = tempfile.mkdtemp(prefix=f"labelcom_usdz_{object_id}_")
    input_glb = os.path.join(tmp_dir, "optimized.glb")
    out_usdz = os.path.join(tmp_dir, "ios.usdz")

    try:
        bucket = storage_client.bucket(bucket_name)
        bucket.blob(optimized_path).download_to_filename(input_glb)

        cmd = [
            BLENDER_BIN,
            "--background",
            "--python",
            BLENDER_SCRIPT,
            "--",
            input_glb,
            out_usdz,
        ]

        try:
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=CONVERT_TIMEOUT_MS / 1000,
                check=False,
                text=True,
            )
        except subprocess.TimeoutExpired:
            return _fail(504, "USDZ conversion timed out")

        if proc.returncode != 0:
            stderr_tail = (proc.stderr or "").strip()[-2000:]
            stdout_tail = (proc.stdout or "").strip()[-2000:]
            details = stderr_tail or stdout_tail or f"Exit code {proc.returncode}"
            return _fail(500, "USDZ conversion failed", details=details)

        out_path = pathlib.Path(out_usdz)
        if not out_path.exists():
            return _fail(500, "USDZ conversion failed", details="Output file missing")

        size_bytes = out_path.stat().st_size
        if size_bytes <= 0:
            return _fail(500, "USDZ conversion failed", details="Output file is empty")
        if TARGET_USDZ_MAX_BYTES and size_bytes > TARGET_USDZ_MAX_BYTES:
            return _fail(
                413,
                "USDZ is too large",
                details=f"{round(size_bytes / 1024 / 1024)} MB (limit {round(TARGET_USDZ_MAX_BYTES / 1024 / 1024)} MB)",
            )

        blob = bucket.blob(usdz_path)
        blob.content_type = "model/vnd.usdz+zip"
        blob.content_disposition = "inline"
        blob.cache_control = "public, max-age=31536000, immutable"
        blob.upload_from_filename(out_usdz)

        try:
            blob.make_public()
        except Exception:
            # If bucket uses uniform access, making public may fail.
            # In that case, rely on bucket-level config / rules.
            pass

        duration_ms = int(time.time() * 1000) - start_ms
        public_url = f"https://storage.googleapis.com/{bucket_name}/{usdz_path}"
        return jsonify(
            {
                "ok": True,
                "objectId": object_id,
                "usdzPath": usdz_path,
                "usdzUrl": public_url,
                "usdzSizeBytes": size_bytes,
                "durationMs": duration_ms,
            }
        )
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    port = _env_int("PORT", 8080)
    app.run(host="0.0.0.0", port=port)

