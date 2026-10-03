# The miniature parking-lot set: asphalt, painted bays, warehouses, hills, clay clouds, lights.
import bpy, math, random
from mathutils import Vector
from lib import clay, flat, blob, box, cone, empty, hexcol

def world(sky='#9fd0ea', strength=0.9):
    w = bpy.data.worlds.new('sky'); bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*hexcol(sky), 1); bg.inputs['Strength'].default_value = strength

def lights(sun_rot=(52, 6, 28), sun=3.2):
    s = bpy.data.lights.new('sun', 'SUN'); s.energy = sun; s.angle = math.radians(6)
    s.color = (1.0, 0.95, 0.86)
    ob = bpy.data.objects.new('sun', s); bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = [math.radians(a) for a in sun_rot]
    return ob

def backdrop(y=34, top='#7fbfe3', bottom='#cfe8f2'):
    """Painted sky card, like a stop-motion set's backdrop, with a soft gradient."""
    m = bpy.data.materials.new('backdrop'); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links
    b = N['Principled BSDF']; b.inputs['Roughness'].default_value = 1
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*hexcol(bottom), 1); ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[1].color = (*hexcol(top), 1); ramp.color_ramp.elements[1].position = 0.8
    L.new(tc.outputs['Generated'], sep.inputs[0]); L.new(sep.outputs['Z'], ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], b.inputs['Base Color']); L.new(ramp.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 0.55
    box('backdrop', m, (90, 0.2, 30), (0, 0, 13), loc=(0, y, -1), bevel=0)

def cloud(name, x, y, z, s, rnd):
    m = clay('#fbfbf7', sss=0.2, bump=0.2)
    g = empty(name, None, (x, y, z))
    for i in range(7):
        blob(f'{name}.{i}', m, (s * rnd.uniform(0.5, 0.8),) * 2 + (s * rnd.uniform(0.4, 0.6),),
             (rnd.uniform(-1.2, 1.2) * s, rnd.uniform(-0.2, 0.2) * s, rnd.uniform(0, 0.4) * s), g, lumpy=0.05)
    return g

def warehouse(name, x, y, w, h, d=4, wall='#c9b28e', roof='#8a7a66', doors=2, windows=1, rnd=None):
    rnd = rnd or random.Random(name)
    box(name, clay(wall, bump=0.5, prints=1.5), (w, d, h), (0, 0, h / 2), loc=(x, y, 0), bevel=0.06)
    box(name + '.roof', clay(roof, bump=0.4), (w + 0.3, d + 0.3, 0.18), (0, 0, h + 0.09), loc=(x, y, 0), bevel=0.05)
    dw = min(1.6, w / (doors + windows + 1))
    slots = doors + windows
    for i in range(slots):
        cx = x - w / 2 + (i + 1) * w / (slots + 1)
        if i < doors:
            box(f'{name}.door{i}', clay('#9aa3a6', bump=0.4), (dw, 0.1, h * 0.62), (0, 0, h * 0.31), loc=(cx, y - d / 2 - 0.03, 0), bevel=0.03)
            for k in range(5):  # roller ribs
                box(f'{name}.rib{i}.{k}', clay('#848d90', bump=0.3), (dw * 0.96, 0.05, 0.03), (0, 0, 0), loc=(cx, y - d / 2 - 0.09, h * 0.62 * (k + 0.5) / 5), bevel=0.012)
        else:
            box(f'{name}.win{i}', clay('#5e7f93', rough=0.3, bump=0.1), (dw * 0.7, 0.1, h * 0.25), (0, 0, 0), loc=(cx, y - d / 2 - 0.03, h * 0.62), bevel=0.03)
            box(f'{name}.sill{i}', clay('#efe6d4'), (dw * 0.8, 0.14, 0.05), (0, 0, 0), loc=(cx, y - d / 2 - 0.05, h * 0.62 - h * 0.13), bevel=0.02)

def parking_lot(seed=3, warehouses=None, bay_rows=((-1.5,), (4.5,)), extent=40):
    rnd = random.Random(seed)
    world()
    backdrop()
    # asphalt slab
    box('asphalt', clay('#5d5f63', rough=0.85, bump=0.9, prints=2.0), (extent * 2, extent * 1.5, 0.2), (0, 0, -0.1), bevel=0)
    # painted bays: rolled clay strips, slightly wobbly like hand-placed
    paint = clay('#efe8cf', bump=0.25)
    for row in bay_rows:
        y0 = row[0]
        for i in range(-10, 11):
            box(f'bay{y0}.{i}', paint, (0.09, 2.2, 0.03), (0, 0, 0.015), loc=(i * 1.6 + rnd.uniform(-0.03, 0.03), y0, 0), rot=(0, 0, rnd.uniform(-0.03, 0.03)), bevel=0.012)
    # kerb + warehouses at the back of the lot
    box('kerb', clay('#b9b4a8', bump=0.5), (extent * 2, 0.4, 0.18), (0, 0, 0.09), loc=(0, 9.6, 0), bevel=0.04)
    for spec in (warehouses or [
        dict(name='wh1', x=-9, y=12.5, w=8, h=3.2, doors=2, windows=1),
        dict(name='wh2', x=-1.5, y=13.5, w=5, h=4.2, wall='#a79a86', roof='#7d705f', doors=1, windows=0),
        dict(name='wh3', x=4.6, y=12.5, w=6, h=2.8, wall='#d2bf9e', doors=1, windows=2),
        dict(name='wh4', x=12, y=13, w=8, h=3.4, doors=2, windows=1),
    ]):
        warehouse(rnd=rnd, **spec)
    # hills and clouds behind
    hill = clay('#7fa65a', bump=0.6, prints=2)
    for i, (x, s) in enumerate([(-22, 9), (-8, 7), (6, 10), (20, 8), (32, 9)]):
        blob(f'hill{i}', hill if i % 2 else clay('#6f9a4f', bump=0.6, prints=2), (s, 3, s * 0.42), (0, 0, 0), loc=(x, 26, -0.5), lumpy=0.4)
    for i, (x, z, s) in enumerate([(-14, 10, 1.4), (-3, 12, 1.1), (9, 11, 1.6), (21, 13, 1.2)]):
        cloud(f'cloud{i}', x, 30, z, s, rnd)
    # a couple of lamp posts
    for i, x in enumerate((-6.5, 8.0)):
        cone(f'post{i}', clay('#6f7275', bump=0.3), 0.07, 0.05, 4.2, (0, 0, 0), loc=(x, 8.8, 0))
        blob(f'lamp{i}', clay('#e9e2c8', bump=0.2), (0.35, 0.18, 0.1), (0, 0, 0), loc=(x - 0.2, 8.8, 4.2))
