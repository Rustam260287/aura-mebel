
import bpy
import sys
import json
import os

# Получаем аргументы командной строки после "--"
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

if len(argv) < 2:
    print("Usage: blender -P script.py -- config.json output.glb")
    sys.exit(1)

config_path = argv[0]
output_path = argv[1]

# Загружаем конфиг
try:
    with open(config_path, 'r') as f:
        config = json.load(f)
except Exception as e:
    print(f"Error loading config: {e}")
    sys.exit(1)

# { "type": "sofa", "size": "compact", "style": "modern", "material": "fabric_dark" }

print(f"Processing config: {config}")

# 1. Логика Размера (Scale)
scale_map = {
    "compact": 0.85,
    "standard": 1.0,
    "grand": 1.15
}
scale_factor = scale_map.get(config.get('size'), 1.0)

# Пытаемся найти Scale_Root (пустышка-родитель для скейла)
scale_root = bpy.data.objects.get("Scale_Root")

if scale_root:
    scale_root.scale = (scale_factor, scale_factor, scale_factor)
    print(f"Applied scale {scale_factor} to Scale_Root")
else:
    # Fallback: Если нет Scale_Root, скейлим все меши в коллекции Geometry, кроме Legs
    if "Geometry" in bpy.data.collections:
        for obj in bpy.data.collections['Geometry'].objects:
            if "Legs" not in obj.name:
                obj.scale[0] = scale_factor # Только по ширине для MVP? Или полностью?
                # Для MVP скейлим полностью, чтобы сохранить пропорции
                # obj.scale = (scale_factor, scale_factor, scale_factor) 
                print(f"Applied scale {scale_factor} to {obj.name}")

# 2. Логика Стиля (Visibility)
target_style = config.get('style', 'modern').capitalize() # "Modern", "Classic", "Soft"

if "Geometry" in bpy.data.collections:
    for obj in bpy.data.collections['Geometry'].objects:
        # Ищем объекты с префиксом Style_
        if "Style_" in obj.name:
            if target_style in obj.name:
                obj.hide_render = False
                obj.hide_viewport = False
                print(f"Show: {obj.name}")
            else:
                obj.hide_render = True
                obj.hide_viewport = True
                print(f"Hide: {obj.name}")

# 3. Логика Материалов (Swap Base Color)
material_colors = {
    "soft": (0.92, 0.90, 0.85, 1),      # #EBE5D9 (Soft/Light)
    "modern": (0.49, 0.49, 0.49, 1),    # #7D7D7D (Modern/Grey)
    "classic": (0.35, 0.27, 0.23, 1),   # #59443B (Classic/Brown)
}

# Используем style для цвета, как в UI, или отдельное поле material, если оно есть
target_color_key = config.get('style', 'soft') 
target_color = material_colors.get(target_color_key, material_colors['soft'])

# Ищем материал-заглушку
mat_fabric = bpy.data.materials.get("Mat_Fabric_Primary")
if mat_fabric and mat_fabric.use_nodes:
    bsdf = mat_fabric.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = target_color
        print(f"Applied color {target_color_key} to Mat_Fabric_Primary")

# 4. Экспорт GLB
try:
    # Создаем директорию, если нет
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False, # Экспортируем всю сцену (видимую)
        export_apply=True,    # Применить модификаторы
        export_cameras=False,
        export_lights=False
    )
    print(f"Successfully exported to {output_path}")
except Exception as e:
    print(f"Export failed: {e}")
    sys.exit(1)
