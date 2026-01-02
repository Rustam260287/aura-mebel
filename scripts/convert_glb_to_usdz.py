import os
import sys
import tempfile
import shutil
import zipfile

try:
    import bpy  # type: ignore
except Exception as e:
    print(f"[convert_glb_to_usdz] Blender bpy is required: {e}")
    sys.exit(1)


def argv_after_double_dash():
    argv = sys.argv
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


def reset_scene():
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
    except Exception:
        # fallback: manually clear
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)


def export_usd(usdc_path: str):
    """
    Export USD using Blender's USD exporter.
    The exact kwargs vary by Blender version, so keep it minimal.
    """
    # Some Blender versions accept additional flags, but passing unknown kwargs breaks execution.
    bpy.ops.wm.usd_export(filepath=usdc_path)


def build_usdz(folder: str, out_usdz: str):
    os.makedirs(os.path.dirname(out_usdz) or ".", exist_ok=True)
    with zipfile.ZipFile(out_usdz, "w", compression=zipfile.ZIP_STORED) as zf:
        for root, _, files in os.walk(folder):
            for name in files:
                src = os.path.join(root, name)
                arc = os.path.relpath(src, folder)
                zf.write(src, arc)


def main():
    argv = argv_after_double_dash()
    if len(argv) < 2:
        print("Usage: blender --background --python convert_glb_to_usdz.py -- input.glb output.usdz")
        sys.exit(1)

    input_glb = argv[0]
    out_usdz = argv[1]

    if not os.path.exists(input_glb):
        print(f"[convert_glb_to_usdz] Input GLB not found: {input_glb}")
        sys.exit(1)

    tmp_dir = tempfile.mkdtemp(prefix="labelcom_usdz_")
    try:
        reset_scene()

        # Import GLB
        bpy.ops.import_scene.gltf(filepath=input_glb)

        usdc_path = os.path.join(tmp_dir, "scene.usdc")
        export_usd(usdc_path)

        # Pack USD + textures (if any) into USDZ.
        build_usdz(tmp_dir, out_usdz)

        if not os.path.exists(out_usdz) or os.path.getsize(out_usdz) == 0:
            print("[convert_glb_to_usdz] Output USDZ is empty")
            sys.exit(2)

        print(f"[convert_glb_to_usdz] USDZ created: {out_usdz}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()

