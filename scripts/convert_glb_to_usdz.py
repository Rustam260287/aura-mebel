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


def _op_kwargs(op, kwargs: dict):
    """
    Return only kwargs supported by the operator (compat across Blender versions).
    """
    try:
        props = {p.identifier for p in op.get_rna_type().properties}
        return {k: v for k, v in kwargs.items() if k in props}
    except Exception:
        return kwargs


def reset_scene():
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
    except Exception:
        # fallback: manually clear
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)

    try:
        scene = bpy.context.scene
        scene.unit_settings.system = "METRIC"
        scene.unit_settings.scale_length = 1.0
    except Exception:
        pass


def enable_addons():
    # Ensure GLTF import and USD export add-ons are enabled in headless runs.
    for module in ("io_scene_gltf2", "io_scene_usd"):
        try:
            bpy.ops.preferences.addon_enable(module=module)
        except Exception:
            pass


def remove_cameras_and_lights():
    try:
        for obj in list(bpy.data.objects):
            if obj.type in {"CAMERA", "LIGHT"}:
                bpy.data.objects.remove(obj, do_unlink=True)
    except Exception:
        pass


def import_glb(glb_path: str):
    kwargs = _op_kwargs(
        bpy.ops.import_scene.gltf,
        {
            "filepath": glb_path,
        },
    )
    bpy.ops.import_scene.gltf(**kwargs)


def export_usd(usdc_path: str):
    """
    Export USD using Blender's USD exporter.
    Keep kwargs dynamic to survive Blender version differences.
    """
    kwargs = _op_kwargs(
        bpy.ops.wm.usd_export,
        {
            "filepath": usdc_path,
            "export_textures": True,
            "relative_paths": True,
            "export_materials": True,
        },
    )
    bpy.ops.wm.usd_export(**kwargs)


def try_export_direct_usdz(out_usdz: str) -> bool:
    """
    Blender may support writing .usdz directly (depends on version/build).
    Try it first; fall back to USD + manual packaging.
    """
    try:
        export_usd(out_usdz)
    except Exception:
        return False
    return os.path.exists(out_usdz) and os.path.getsize(out_usdz) > 0


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
        enable_addons()

        # Import GLB
        import_glb(input_glb)
        remove_cameras_and_lights()

        # Prefer native USDZ export when supported.
        if not try_export_direct_usdz(out_usdz):
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
