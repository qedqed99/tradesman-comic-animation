# Clay turnaround sheets: front, 3/4, side, back + three expression close-ups per character,
# plus a line-up of all three for scale. Output: clay/sheets/turn/<who>_<view>.jpg
#   /opt/clay/bin/python clay/blender/turnaround.py [noah lu boss] [--samples 24] [--quick]
import sys, os, math, time
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import bpy
from mathutils import Vector

args = [a for a in sys.argv[1:] if not a.startswith('--')]
samples = int(sys.argv[sys.argv.index('--samples') + 1]) if '--samples' in sys.argv else 24
quick = '--quick' in sys.argv
if '--samples' in sys.argv: args = [a for a in args if a != str(samples)]
WHO = args or ['noah', 'lu', 'boss']
OUT = os.path.join(ROOT, 'clay', 'sheets', 'turn'); os.makedirs(OUT, exist_ok=True)

EXPR = {
    'noah': [('focused', {'nod': 10, 'lookY': 0.7, 'eyes': 'tired', 'mouth': 'flat', 'browTilt': -6}),
             ('startled', {'eyes': 'wide', 'raise': 1.4, 'mouth': 'o', 'open': 0.5, 'lookX': 0.6}),
             ('yell', {'eyes': 'wide', 'raise': 1.0, 'browTilt': 10, 'mouth': 'yell', 'open': 1.0, 'tilt': -4})],
    'lu':   [('beaming', {'eyes': 'happy', 'raise': 0.8, 'mouth': 'grin', 'open': 0.75, 'tilt': 4}),
             ('determined', {'eyes': 'angry', 'browTilt': 14, 'mouth': 'talk', 'open': 0.45, 'nod': -4}),
             ('No!', {'eyes': 'tired', 'browTilt': -10, 'raise': -0.4, 'mouth': 'frown', 'open': 0.0})],
    'boss': [('laugh', {'raise': 1.0, 'mouth': 'grin', 'open': 0.85, 'tilt': -5, 'nod': -6}),
             ('on it', {'raise': 0.4, 'mouth': 'smile', 'tilt': 6, 'browTilt': -8}),
             ('surprised', {'raise': 1.6, 'mouth': 'o', 'open': 0.7})],
}

def studio():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import importlib, lib, cast
    importlib.reload(lib); importlib.reload(cast)
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.62, 0.66, 0.7, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    # seamless backdrop: floor curving up into a wall
    from cast import lathe
    m = lib.clay('#c9ced2', rough=0.9, bump=0.1, prints=0.3)
    lib.box('floor', m, (12, 8, 0.1), (0, 2, -0.05), bevel=0)
    lib.box('wall', m, (12, 0.1, 8), (0, 5, 4), bevel=0)
    for name, rot, energy, loc, size in [('key', (55, 0, -35), 260, (-2.2, -2.6, 3.2), 2.0), ('fill', (70, 0, 50), 90, (2.6, -2.2, 2.2), 3.0), ('rim', (-60, 0, 160), 160, (1.2, 3.0, 2.8), 1.5)]:
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.size = size
        ob = bpy.data.objects.new(name, L); sc.collection.objects.link(ob); ob.location = loc
        d = Vector((0, 0, 1.0)) - Vector(loc); ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam = bpy.data.cameras.new('cam'); cam.lens = 85
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 8 if quick else samples
    sc.cycles.use_denoising = True; sc.cycles.max_bounces = 4
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90
    sc.render.use_persistent_data = True
    return sc, co, cast

def aim(co, loc, target):
    co.location = loc
    d = Vector(target) - Vector(loc); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def shot(sc, path, w, h):
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

t0 = time.time()
for who in WHO:
    sc, co, cast = studio()
    p = cast.Clay(who)
    H = cast.CAST[who]['height']
    base = dict(arms={'L': {'out': 12, 'bend': 8}, 'R': {'out': 12, 'bend': 8}}, head=dict(mouth='smile'))
    co.data.lens = 70
    for view, rz in [('front', 0), ('three-quarter', -35), ('side', -90), ('back', 180)]:
        p.pose(rotz=rz, **base)
        dist = H * 3.0 + 1.2
        aim(co, (0, -dist, H * 0.55), (0, 0, H * 0.5))
        shot(sc, os.path.join(OUT, f'{who}_{view}.jpg'), 600 if quick else 720, 900 if quick else 1080)
        print(who, view, f'{time.time() - t0:.0f}s', flush=True)
    co.data.lens = 85
    hz = p.head.matrix_world.translation.z + p.R * 1.05
    for name, hd in EXPR[who]:
        p.pose(rotz=-12, arms=base['arms'], head=hd)
        aim(co, (0.25, -1.45, hz + 0.05), (0, 0, hz))
        shot(sc, os.path.join(OUT, f'{who}_expr_{name.replace("!", "").replace(" ", "-").lower()}.jpg'), 600 if quick else 720, 600 if quick else 720)
        print(who, name, f'{time.time() - t0:.0f}s', flush=True)

if not args:  # line-up of all three for scale
    sc, co, cast = studio()
    for who, x in (('lu', -0.75), ('noah', 0.0), ('boss', 0.8)):
        cast.Clay(who).pose(x=x, rotz=-8 if x < 0 else 8 if x > 0 else 0,
                            arms={'L': {'out': 12, 'bend': 8}, 'R': {'out': 12, 'bend': 8}}, head=dict(mouth='smile'))
    co.data.lens = 50
    aim(co, (0, -6.0, 1.1), (0, 0, 0.95))
    shot(sc, os.path.join(OUT, 'lineup.jpg'), 1600, 1000)
    print('lineup', f'{time.time() - t0:.0f}s', flush=True)
