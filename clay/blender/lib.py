# Clay toolkit: materials, lumpy primitives and the puppet builder.
# Everything is built from code; nothing is hand-modelled. Units are roughly metres,
# the camera looks along +Y, characters face -Y (toward the camera), Z is up.
import bpy, bmesh, math, random, os
from mathutils import Vector, Matrix

def hexcol(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

_mats = {}
def clay(color, rough=0.62, sss=0.06, bump=0.32, prints=1.0, name=None):
    """Plasticine look: soft subsurface, matte sheen, fine grain plus thumb-print dents."""
    if os.environ.get('CLAY_NOSSS'): sss = 0
    if os.environ.get('CLAY_NOBUMP'): bump = 0
    key = (color, rough, sss, bump, prints)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name or 'clay_' + color)
    m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexcol(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Subsurface Scale'].default_value = 0.02
    b.inputs['Sheen Weight'].default_value = 0.15
    tc = N.new('ShaderNodeTexCoord')
    grain = N.new('ShaderNodeTexNoise'); grain.inputs['Scale'].default_value = 140; grain.inputs['Detail'].default_value = 2
    dents = N.new('ShaderNodeTexNoise'); dents.inputs['Scale'].default_value = 7; dents.inputs['Detail'].default_value = 0
    mix = N.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    mix.inputs[1].default_value = 0.6 * prints
    L.new(tc.outputs['Object'], grain.inputs['Vector']); L.new(tc.outputs['Object'], dents.inputs['Vector'])
    L.new(dents.outputs['Fac'], mix.inputs[0]); L.new(grain.outputs['Fac'], mix.inputs[2])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.004
    L.new(mix.outputs[0], bp.inputs['Height'])
    if bump > 0: L.new(bp.outputs['Normal'], b.inputs['Normal'])
    _mats[key] = m
    return m

def flat(color, strength=1.0):
    m = bpy.data.materials.new('flat_' + color); m.use_nodes = True
    N = m.node_tree.nodes; b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexcol(color), 1)
    b.inputs['Emission Color'].default_value = (*hexcol(color), 1)
    b.inputs['Emission Strength'].default_value = strength
    return m

_lumps = None
def lump_tex():
    global _lumps
    if _lumps is None:
        _lumps = bpy.data.textures.new('lumps', 'CLOUDS'); _lumps.noise_scale = 0.35
    return _lumps

def _finish(name, bm, mat, parent, loc, rot, lumpy, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat: me.materials.append(mat)
    if parent: ob.parent = parent
    ob.location = loc; ob.rotation_euler = rot
    if lumpy:
        d = ob.modifiers.new('lumps', 'DISPLACE'); d.texture = lump_tex(); d.strength = lumpy; d.mid_level = 0.5
        d.texture_coords = 'LOCAL'
    return ob

def blob(name, mat, r=(1, 1, 1), at=(0, 0, 0), parent=None, loc=(0, 0, 0), rot=(0, 0, 0), lumpy=0.006, seg=28):
    """Ellipsoid with radii r, centred at `at` inside the object (object origin = pivot)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(at) @ Matrix.Diagonal((*r, 1)), verts=bm.verts)
    return _finish(name, bm, mat, parent, loc, rot, lumpy)

def box(name, mat, size=(1, 1, 1), at=(0, 0, 0), parent=None, loc=(0, 0, 0), rot=(0, 0, 0), lumpy=0.0, bevel=0.02, smooth=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(at) @ Matrix.Diagonal((*size, 1)), verts=bm.verts)
    ob = _finish(name, bm, mat, parent, loc, rot, lumpy, smooth)
    if bevel:
        bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = bevel; bv.segments = 3; bv.harden_normals = True
        ob.modifiers.move(len(ob.modifiers) - 1, 0)
        me = ob.data; me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    return ob

def cone(name, mat, r1, r2, depth, at=(0, 0, 0), parent=None, loc=(0, 0, 0), rot=(0, 0, 0), lumpy=0.004, seg=20):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=depth)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(at) + Vector((0, 0, depth / 2))), verts=bm.verts)
    return _finish(name, bm, mat, parent, loc, rot, lumpy)

def torus(name, mat, R, r, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), arc=1.0, seg=40, ring=12, lumpy=0.0):
    """Ring in the XZ plane (faces -Y). arc < 1 makes an open arc, centred at the bottom (a smile)."""
    bm = bmesh.new()
    rows = []
    for i in range(seg + (1 if arc < 1 else 0)):
        u = (i / seg) * arc * 2 * math.pi + (math.pi * 1.5 - arc * math.pi if arc < 1 else 0)
        row = []
        for j in range(ring):
            v = j / ring * 2 * math.pi
            rr = R + r * math.cos(v)
            row.append(bm.verts.new((rr * math.cos(u), r * math.sin(v), rr * math.sin(u))))
        rows.append(row)
    n = len(rows)
    for i in range(n if arc >= 1 else n - 1):
        a, b2 = rows[i], rows[(i + 1) % n]
        for j in range(ring):
            bm.faces.new((a[j], a[(j + 1) % ring], b2[(j + 1) % ring], b2[j]))
    if arc < 1:
        for row in (rows[0], rows[-1]):
            bm.faces.new(row if row is rows[-1] else list(reversed(row)))
    return _finish(name, bm, mat, parent, loc, rot, lumpy)

def empty(name, parent=None, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent; ob.location = loc; ob.empty_display_size = 0.05
    return ob

def snake(name, mat, pts, r=0.008, parent=None, loc=(0, 0, 0)):
    """A rolled clay snake along points (used for check marks, mouths, lines)."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (*c, 1)
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    cu.materials.append(mat); ob.parent = parent; ob.location = loc
    return ob


# ---------------------------------------------------------------- puppets
CAST = {
    'noah': dict(kind='kid', skin='#f2c493', hair='messy', hairColor='#6b4428', iris='#2a1a0e', shirt='#4f7896',
                 bottom='#5f5c3d', shoes='#8d5a2c', socks='#efeadf', cape='#d8432a', blush=True),
    'lu': dict(kind='adult', skin='#efbf8b', hair='spiky', hairColor='#221c19', iris='#1d140e', shirt='#f5f1e6',
               logo='olympic', bottom='#2a2a2f', shoes='#c4c7cb', glasses='#5e4935', stubble=False),
}

DIMS = {
    # hip height, leg length/radius, torso radii + centre, neck height, head radius, shoulder x/z, arm lengths/radius
    'kid':   dict(hip=0.40, leg=0.34, legr=0.065, torso=(0.20, 0.16, 0.25), tz=0.20, neck=0.40, head=0.27,
                  sx=0.17, sz=0.32, up=0.17, fore=0.16, armr=0.05, hand=0.055),
    'adult': dict(hip=0.86, leg=0.80, legr=0.085, torso=(0.25, 0.17, 0.36), tz=0.32, neck=0.66, head=0.215,
                  sx=0.24, sz=0.56, up=0.29, fore=0.27, armr=0.06, hand=0.06),
}

class Puppet:
    def __init__(self, who, parent=None):
        c = CAST[who]; d = DIMS[c['kind']]; self.who = who; self.c = c; self.d = d
        skin = clay(c['skin'], sss=0.12)
        self.root = empty(who, parent)
        self.hips = empty(who + '.hips', self.root, (0, 0, d['hip']))
        # legs: one sausage each, sock and shoe on the end
        self.leg = {}
        for side, sx in (('L', 1), ('R', -1)):
            p = empty(f'{who}.leg{side}', self.hips, (sx * d['torso'][0] * 0.42, 0, 0))
            blob(f'{who}.thigh{side}', skin if c['kind'] == 'kid' else clay(c['bottom']), (d['legr'], d['legr'], d['leg'] / 2 + 0.02), (0, 0, -d['leg'] / 2), p)
            if c.get('socks'):
                blob(f'{who}.sock{side}', clay(c['socks']), (d['legr'] * 1.08, d['legr'] * 1.08, 0.05), (0, 0, -d['leg'] + 0.07), p)
            blob(f'{who}.shoe{side}', clay(c['shoes'], rough=0.5), (d['legr'] * 1.35, d['legr'] * 2.0, d['legr'] * 0.8), (0, -d['legr'] * 0.7, -d['leg'] + 0.0), p)
            self.leg[side] = p
        # torso
        self.torso = empty(who + '.torso', self.hips)
        tr = d['torso']
        blob(who + '.shirt', clay(c['shirt']), tr, (0, 0, d['tz']), self.torso, lumpy=0.008)
        blob(who + '.bottoms', clay(c['bottom']), (tr[0] * 1.02, tr[1] * 1.04, tr[2] * 0.42), (0, 0, 0.02), self.torso)
        if c['kind'] == 'kid':
            for side, sx in (('L', 1), ('R', -1)):  # shorts legs
                blob(f'{who}.short{side}', clay(c['bottom']), (0.085, 0.085, 0.09), (sx * 0.085, 0, -0.06), self.torso)
        if c.get('logo') == 'olympic':
            cols = ['#2f6fd0', '#1d1d1d', '#d23a2a', '#e8b52a', '#2f9a4a']
            for i, (x, z) in enumerate([(-0.07, 0.42), (0, 0.42), (0.07, 0.42), (-0.035, 0.385), (0.035, 0.385)]):
                y = -math.sqrt(max(1 - (x / tr[0]) ** 2 - ((z - d['tz']) / tr[2]) ** 2, 0.01)) * tr[1] - 0.006
                torus(f'{who}.ring{i}', clay(cols[i], bump=0.1), 0.028, 0.0065, self.torso, (x, y, z), (math.radians(-12), 0, 0))
        # arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand
        self.arm = {}; self.hand = {}
        for side, sx in (('L', 1), ('R', -1)):
            sh = empty(f'{who}.shoulder{side}', self.torso, (sx * d['sx'], 0, d['sz']))
            blob(f'{who}.upper{side}', skin, (d['armr'] * 1.0, d['armr'] * 1.0, d['up'] / 2 + 0.03), (0, 0, -d['up'] / 2), sh)
            blob(f'{who}.sleeve{side}', clay(c['shirt']), (d['armr'] * 1.55, d['armr'] * 1.55, d['up'] * 0.42), (0, 0, -d['up'] * 0.18), sh)
            el = empty(f'{who}.elbow{side}', sh, (0, 0, -d['up']))
            blob(f'{who}.fore{side}', skin, (d['armr'], d['armr'], d['fore'] / 2 + 0.02), (0, 0, -d['fore'] / 2), el)
            h = empty(f'{who}.hand{side}', el, (0, 0, -d['fore'] - d['hand'] * 0.6))
            blob(f'{who}.palm{side}', skin, (d['hand'], d['hand'] * 0.7, d['hand'] * 1.05), (0, 0, 0), h)
            blob(f'{who}.thumb{side}', skin, (0.02, 0.02, 0.035), (-sx * d['hand'] * 0.85, -0.01, 0.01), h, rot=(0, sx * 0.5, 0))
            self.arm[side] = (sh, el); self.hand[side] = h
        # cape (Noah): a curved sheet hanging from the shoulders, pivot at the neck
        if c.get('cape'):
            self.cape = empty(who + '.capeP', self.torso, (0, 0.10, d['neck'] - 0.03))
            bm = bmesh.new()
            W, H, cols_, rows_ = 0.42, 0.62, 12, 10
            vs = [[bm.verts.new(((u / cols_ - 0.5) * W * (1 + 0.5 * v / rows_), 0.06 * math.cos((u / cols_ - 0.5) * math.pi) * -1 + 0.08 * (v / rows_),
                                 -v / rows_ * H)) for u in range(cols_ + 1)] for v in range(rows_ + 1)]
            for v in range(rows_):
                for u in range(cols_):
                    bm.faces.new((vs[v][u], vs[v][u + 1], vs[v + 1][u + 1], vs[v + 1][u]))
            self.capeOb = _finish(who + '.cape', bm, clay(c['cape']), self.cape, (0, 0, 0), (0, 0, 0), 0.0)
            so = self.capeOb.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.022
            self.capeOb.modifiers.new('sub', 'SUBSURF').levels = 1
            blob(who + '.capeTie', clay(c['cape']), (0.17, 0.12, 0.035), (0, -0.04, 0.0), self.cape)
        # head
        R = d['head']
        self.neck = empty(who + '.neck', self.torso, (0, 0, d['neck']))
        self.head = empty(who + '.head', self.neck, (0, 0, 0))
        hc = Vector((0, 0, R * 0.92))
        self.hc = hc; self.R = R
        blob(who + '.skull', skin, (R, R * 0.95, R * 0.98), hc, self.head, lumpy=0.004)
        if c['kind'] == 'adult':  # a bit of jaw and neck
            blob(who + '.neckb', skin, (0.07, 0.07, 0.08), (0, 0, 0.0), self.neck)
            blob(who + '.jaw', skin, (R * 0.8, R * 0.75, R * 0.5), hc + Vector((0, -0.02, -R * 0.5)), self.head)
        def surf(x, z, out=0.0):  # point on the front of the head
            dx, dz = x / R, (z - hc.z) / R
            return Vector((x, -math.sqrt(max(1 - dx * dx - dz * dz, 0.02)) * R * 0.95 - out, z))
        self.surf = surf
        # nose, ears
        blob(who + '.nose', skin, (R * 0.12, R * 0.12, R * 0.11), surf(0, hc.z - R * 0.12, -0.01), self.head)
        for side, sx in (('L', 1), ('R', -1)):
            blob(f'{who}.ear{side}', skin, (R * 0.1, R * 0.08, R * 0.17), (sx * R * 0.98, 0, hc.z - R * 0.05), self.head)
        # eyes: white beads with black pupils; each eye has a pivot we squash to blink
        self.eye = {}; self.pupil = {}; self.brow = {}
        ex, ez = R * 0.36, hc.z + R * 0.12
        er = R * (0.24 if c['kind'] == 'kid' else 0.2)
        for side, sx in (('L', 1), ('R', -1)):
            p = empty(f'{who}.eyeP{side}', self.head, surf(sx * ex, ez, -er * 0.35))
            blob(f'{who}.eye{side}', clay('#fbf8f0', rough=0.35, bump=0.05), (er, er * 0.6, er * 1.1), (0, 0, 0), p, lumpy=0)
            pu = blob(f'{who}.pupil{side}', clay(c['iris'], rough=0.2, bump=0.0), (er * 0.5, er * 0.3, er * 0.55), (0, 0, 0), p, loc=(0, -er * 0.42, 0), lumpy=0)
            blob(f'{who}.glint{side}', flat('#ffffff', 2.0), (er * 0.13, er * 0.1, er * 0.13), (0, 0, 0), pu, loc=(er * 0.18, -er * 0.25, er * 0.2), lumpy=0)
            b = empty(f'{who}.browP{side}', self.head, surf(sx * ex, ez + er * 1.6, -0.006))
            blob(f'{who}.brow{side}', clay(c['hairColor']), (er * 0.95, 0.018, 0.016 if c['kind'] == 'kid' else 0.02), (0, 0, 0), b)
            self.eye[side] = p; self.pupil[side] = pu; self.brow[side] = b; self.er = er
        if c.get('glasses'):
            gm = clay(c['glasses'], rough=0.4, bump=0.05)
            for side, sx in (('L', 1), ('R', -1)):
                torus(f'{who}.lens{side}', gm, er * 1.5, 0.011, self.head, (sx * ex * 1.05, -R * 1.0, ez), (0, 0, 0))
                blob(f'{who}.arm{side}', gm, (0.008, R * 0.5, 0.008), (0, 0, 0), self.head, loc=(sx * (ex * 1.05 + er * 1.5), -R * 0.55, ez))
            snake(who + '.bridge', gm, [(-ex * 1.05 + er * 1.5, 0, 0), (0, -0.004, 0.012), (ex * 1.05 - er * 1.5, 0, 0)], 0.008, self.head, (0, -R * 1.0, ez))
        if c.get('blush'):
            for side, sx in (('L', 1), ('R', -1)):
                blob(f'{who}.blush{side}', clay('#ec8f7c', sss=0.1), (R * 0.13, 0.01, R * 0.08), surf(sx * R * 0.55, hc.z - R * 0.22, -0.002), self.head, lumpy=0)
        if c.get('stubble'):
            blob(who + '.stubble', clay('#a98a6c', bump=0.6), (R * 0.62, R * 0.3, R * 0.32), surf(0, hc.z - R * 0.62, -0.03) + Vector((0, 0.035, 0)), self.head)
        # mouth: a dark open shape (scaled by how open) and a rolled smile line
        mz = hc.z - R * (0.42 if c['kind'] == 'kid' else 0.47)
        self.mouthP = empty(who + '.mouthP', self.head, surf(0, mz, -0.002))
        self.mouthOpen = blob(who + '.mouth', clay('#5a1f1c', rough=0.5, bump=0.05), (R * 0.26, R * 0.12, R * 0.2), (0, 0, 0), self.mouthP, lumpy=0)
        self.tongue = blob(who + '.tongue', clay('#d0605a', bump=0.05), (R * 0.13, R * 0.08, R * 0.06), (0, -R * 0.015, -R * 0.08), self.mouthOpen, lumpy=0)
        self.smile = torus(who + '.smile', clay('#5a1f1c', rough=0.5, bump=0.05), R * 0.24, 0.011, self.mouthP, (0, -0.004, R * 0.17), arc=0.32)
        # hair
        hm = clay(c['hairColor'], rough=0.7, bump=0.5)
        rnd = random.Random(who)
        if c['hair'] == 'messy':
            blob(who + '.cap', hm, (R * 1.0, R * 0.97, R * 0.62), hc + Vector((0, 0.03, R * 0.4)), self.head, lumpy=0.008)
            for i in range(40):
                th = rnd.uniform(-1, 1) * math.pi; ph = rnd.uniform(0.0, 0.62) * math.pi
                front = math.cos(th) < 0  # -Y is the face side
                if front and ph > 0.22 * math.pi:
                    continue
                v = Vector((math.sin(ph) * math.sin(th), math.sin(ph) * math.cos(th), math.cos(ph))) * R * 0.9
                s = rnd.uniform(0.27, 0.38) * R
                blob(f'{who}.hair{i}', hm, (s, s, s * 0.8), hc + v, self.head, lumpy=0.01)
            for i, x in enumerate((-0.5, -0.17, 0.17, 0.48)):  # fringe tufts
                blob(f'{who}.fringe{i}', hm, (R * 0.2, R * 0.13, R * 0.13), surf(x * R, hc.z + R * 0.8, -0.005), self.head, rot=(0.3, 0, -x * 0.6), lumpy=0.006)
        else:
            blob(who + '.cap', hm, (R * 1.02, R * 0.98, R * 0.6), hc + Vector((0, 0.02, R * 0.42)), self.head, lumpy=0.006)
            for i in range(22):
                th = rnd.uniform(-1, 1) * math.pi; ph = rnd.uniform(0.0, 0.42) * math.pi
                d_ = Vector((math.sin(ph) * math.sin(th), math.sin(ph) * math.cos(th), math.cos(ph)))
                base = hc + d_ * R * 0.9
                ob = cone(f'{who}.spike{i}', hm, R * 0.16, 0.004, R * rnd.uniform(0.32, 0.5), (0, 0, 0), self.head, base)
                ob.rotation_mode = 'QUATERNION'; ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d_)

    # pose: dictionary mirroring the v1 SVG puppet's pose (angles in degrees)
    def pose(self, x=0, y=0, rotz=0, bob=0, lean=0, legs=None, arms=None, head=None, cape=0, jitter=0, seed=0):
        rnd = random.Random(seed)
        j = lambda s=1.0: rnd.uniform(-1, 1) * jitter * s
        r = math.radians
        self.root.location = (x, y, 0); self.root.rotation_euler = (0, 0, r(rotz))
        self.hips.location = (0, 0, self.d['hip'] + bob)
        self.torso.rotation_euler = (r(lean[0] if isinstance(lean, tuple) else 0) + j(0.01), r(lean[1] if isinstance(lean, tuple) else lean) + j(0.01), 0)
        legs = legs or {}
        for s in 'LR':
            lg = legs.get(s, {})
            self.leg[s].rotation_euler = (r(-lg.get('fwd', 0)), r(lg.get('out', 0) * (-1 if s == 'L' else 1)), 0)
        arms = arms or {}
        for s in 'LR':
            a = arms.get(s, {}); sh, el = self.arm[s]
            sgn = -1 if s == 'L' else 1
            sh.rotation_euler = (r(-a.get('fwd', 0)) + j(0.02), r(sgn * a.get('out', 8)) + j(0.02), r(sgn * a.get('twist', 0)))
            el.rotation_euler = (r(-a.get('bend', 0)) + j(0.02), 0, 0)
            self.hand[s].rotation_euler = (r(a.get('wrist', 0)), 0, r(a.get('handTwist', 0)))
        h = head or {}
        self.head.rotation_euler = (r(h.get('nod', 0)) + j(0.01), r(-h.get('tilt', 0)) + j(0.01), r(h.get('turn', 0)) + j(0.01))
        er = self.er
        lx, ly = h.get('lookX', 0), h.get('lookY', 0)
        wide = h.get('eyes') == 'wide'
        blink = h.get('blink', 0)
        for s in 'LR':
            e = self.eye[s]
            sc = 1.2 if wide else 1.0
            e.scale = (sc, sc, max(0.08, sc * (1 - blink)))
            self.pupil[s].location = (lx * er * 0.45, -er * 0.42, -ly * er * 0.45)
            self.pupil[s].scale = (0.75, 0.75, 0.75) if wide else (1, 1, 1)
            b = self.brow[s]; sgn = 1 if s == 'L' else -1
            b.location = self.surf(sgn * self.R * 0.36, self.hc.z + self.R * 0.12 + er * 1.6 + h.get('raise', 0) * er * 0.5, -0.006)
            b.rotation_euler = (0, r(-sgn * h.get('browTilt', 0)), 0)
        mouth = h.get('mouth', 'smile'); op = h.get('open', 0)
        self.smile.hide_render = mouth not in ('smile', 'grin')
        self.mouthOpen.hide_render = mouth in ('smile', 'flat') and op < 0.05
        w = {'o': 0.6, 'talk': 0.9, 'grin': 1.25, 'flat': 0.8}.get(mouth, 1.0)
        self.mouthOpen.scale = (w, 1, max(0.12, op * (1.4 if mouth == 'o' else 1.0)))
        self.mouthOpen.location = (0, 0, self.R * 0.05 if mouth == 'grin' else 0)
        self.smile.scale = (1.25, 1, 1.1) if mouth == 'grin' else (1, 1, 1)
        if mouth == 'flat':
            self.smile.hide_render = False; self.smile.scale = (0.8, 1, 0.25)
        if hasattr(self, 'cape'):
            self.cape.rotation_euler = (r(18 + cape * 50) + j(0.02), 0, 0)
