import bpy
import sys
import os

# --- HARDENED BLENDER SCRIPT ---

# 1. Reset Blender State
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Parse Arguments
# Usage: blender -b -P convert.py -- input.glb output.usdc
argv = sys.argv
if "--" not in argv:
    print("FATAL: No arguments passed after '--'")
    sys.exit(1)

args = argv[argv.index("--") + 1:]
if len(args) < 2:
    print("FATAL: Expected input and output paths")
    sys.exit(1)

input_path = args[0]
output_path = args[1]

print(f"DTO [START]: {input_path} -> {output_path}")

# 3. Import GLB
try:
    bpy.ops.import_scene.gltf(filepath=input_path)
except Exception as e:
    print(f"FATAL: GLB Import failed: {e}")
    sys.exit(1)

# 4. Cleanup Scene (Optional, but good for cleanliness)
# (In an empty scene, imported objects are usually selected. Good enough.)

# 5. Export USD (USDC Format)
# We export to .usdc (binary Crate) because it's efficient and robust.
# The Node.js wrapper will ZIP this into a .usdz archive.
try:
    bpy.ops.wm.usd_export(
        filepath=output_path,
        check_existing=False,
        selected_objects_only=False,
        visible_objects_only=True,
        export_animation=False, 
        export_hair=False,
        export_uvs=True,
        export_normals=True,
        export_materials=True,
        export_textures=True, # Critical: writes textures to dist/textures/
        root_prim_path='/Root',
        default_prim_path='/Root',
        relative_paths=True # Keep texture paths relative for zipping
    )
    print("DTO [SUCCESS]")
except Exception as e:
    print(f"FATAL: USD Export failed: {e}")
    sys.exit(1)
