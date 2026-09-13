"""Blender-generated teaching geometry, not a fabricated-device design.
Run with Blender --background --python tools/build-spreader-visuals.py.
One Blender unit represents one foot. Attachment centers drive every sling.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'blender'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.quality = 88
scene.world.color = (.20, .20, .20)
scene.view_settings.view_transform = 'AgX'

def mat(name, color, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metal
    bs.inputs['Roughness'].default_value = .32
    return m

gold = mat('Upper sling — tension', (.85,.55,.12), .45)
teal = mat('Lower sling — tension', (.07,.7,.55), .35)
blue = mat('Spreader', (.07,.27,.5), .35)
steel = mat('Symbolic attachment centers', (.45,.55,.65), .65)
load = mat('Centered classroom payload', (.3,.39,.48), .25)
orange = mat('Compression force arrows', (1,.23,.04))
floor = mat('Studio', (.015,.035,.065))

def finish(o, name, material):
    o.name = name
    o.data.materials.append(material)
    return o

def box(name, location, size, material, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    o = finish(bpy.context.object,name,material)
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new('Soft edges','BEVEL')
    mod.width = bevel
    mod.segments = 3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def rod(name, a, b, radius, material):
    a,b = Vector(a),Vector(b)
    v = b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=v.length, location=(a+b)/2)
    o=finish(bpy.context.object,name,material)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    for p in o.data.polygons: p.use_smooth=True
    return o

def ball(name, xyz):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=.14, location=xyz)
    return finish(bpy.context.object,name,steel)

def arrow(name,a,b):
    a,b=Vector(a),Vector(b)
    v=(b-a).normalized()
    rod(name,a,b-v*.34,.055,orange)
    bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.17,radius2=0,depth=.4,location=b-v*.2)
    o=finish(bpy.context.object,name+' arrowhead',orange)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()

# Lower lines remain vertical. All ideal force paths share the y=0 plane.
box('Symmetric spreader — schematic body',(0,0,3),(10.25,.42,.42),blue)
box('Centered payload',(0,0,.3),(10.4,1.7,.6),load)
for x in (-4.5,4.5):
    box('Skid foot',(x,0,-.1),(.6,1.9,.2),steel)
for x in (-5,5):
    rod('Vertical lower sling',(x,0,.6),(x,0,3),.065,teal)
    ball('Lower load attachment',(x,0,.6))
    ball('Spreader end attachment',(x,0,3))
arrow('Left inward compression',(-4,-.42,3),(-2,-.42,3))
arrow('Right inward compression',(4,-.42,3),(2,-.42,3))
# Keep the payload visibly suspended, so the studio ground cannot imply a
# supporting reaction that contradicts the calculated sling forces.
box('Ground',(0,0,-1.6),(200,200,.2),floor)

bpy.ops.object.camera_add()
camera=bpy.context.object
camera.data.type='ORTHO'
scene.camera=camera
for location,power,size in [((0,-8,18),2300,10),((8,4,15),1900,8),((-9,-2,8),1300,7)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object
    light.data.energy=power
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(Vector((0,0,5))-light.location).to_track_quat('-Z','Y').to_euler()

metadata=[]
dynamic=[]
for angle in range(30,76,5):
    for obj in dynamic: bpy.data.objects.remove(obj,do_unlink=True)
    rise=5*math.tan(math.radians(angle))
    top=Vector((0,0,3+rise))
    dynamic=[rod('Upper sling left',(-5,0,3),top,.075,gold),rod('Upper sling right',(5,0,3),top,.075,gold),ball('Ideal upper connection',top)]
    target=Vector((0,0,(3+rise)/2))
    camera.location=target+Vector((6,-26,7))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=max(15.8,(4+rise)*1.4)
    bpy.context.view_layer.update()
    # Check every assembly bounding-box corner, excluding lights and ground.
    for obj in scene.objects:
        if obj.type != 'MESH' or obj.name == 'Ground': continue
        for corner in obj.bound_box:
            p=world_to_camera_view(scene,camera,obj.matrix_world @ Vector(corner))
            assert .025 < p.x < .975 and .025 < p.y < .975, (angle,obj.name,tuple(p))
    scene.render.filepath=str(OUT/f'spreader-{angle}.webp')
    scene['teaching_model']='Symmetric static classroom model; attachment centers exact; connector shapes symbolic; no structural capacity represented.'
    scene['upper_angle_degrees']=angle
    scene['attachment_span_ft']=10
    bpy.ops.render.render(write_still=True)
    metadata.append(dict(angle=angle,span_ft=10,rise_ft=rise,upper_tension_lb=5500/math.sin(math.radians(angle)),compression_lb=5500/math.tan(math.radians(angle))))
    if angle==60:
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'spreader-classroom.blend'))
(OUT/'geometry.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
