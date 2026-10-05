# Clay cast v2, built from the model sheets (clay/sheets) rather than the v1 cartoon puppets.
# Sculpted in code: lathed bodies and limbs, deformed heads with features placed by ray-casting
# onto the face, eyeballs with lids, teardrop hair locks. Same pose() API as lib.Puppet.
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from lib import clay, flat, blob, box, cone, torus, snake, empty, _finish

def smooth_profile(pts, n=6):
    """Catmull-Rom through (z, rx, ry) profile points."""
    out = []
    P = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(P) - 2):
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * P[i][j]) + (-P[i - 1][j] + P[i + 1][j]) * t +
                                    (2 * P[i - 1][j] - 5 * P[i][j] + 4 * P[i + 1][j] - P[i + 2][j]) * t * t +
                                    (-P[i - 1][j] + 3 * P[i][j] - 3 * P[i + 1][j] + P[i + 2][j]) * t ** 3) for j in range(len(P[i]))))
    out.append(pts[-1])
    return out

def lathe_bm(profile, seg=32, close=True, p=2.0):
    """Body of revolution with an elliptical section; profile = [(z, rx, ry[, yoff])], bottom to top."""
    bm = bmesh.new()
    prof = smooth_profile(profile)
    rings = []
    sq = lambda u: math.copysign(abs(u) ** (2 / p), u)
    for q in prof:
        z, rx, ry = q[0], max(q[1], 1e-4), max(q[2], 1e-4)
        yo = q[3] if len(q) > 3 else 0
        rings.append([bm.verts.new((rx * sq(math.cos(a)), yo + ry * sq(math.sin(a)), z)) for a in (i / seg * 2 * math.pi for i in range(seg))])
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((r0[i], r0[(i + 1) % seg], r1[(i + 1) % seg], r1[i]))
    if close:
        for ring, z, flip in ((rings[0], prof[0][0], True), (rings[-1], prof[-1][0], False)):
            c = bm.verts.new((0, prof[0][3] if len(prof[0]) > 3 and flip else 0, z))
            for i in range(seg):
                f = (ring[i], ring[(i + 1) % seg], c)
                bm.faces.new(tuple(reversed(f)) if flip else f)
    bm.normal_update()
    return bm

def lathe(name, mat, profile, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), lumpy=0.003, seg=32, p=2.0):
    return _finish(name, lathe_bm(profile, seg, p=p), mat, parent, loc, rot, lumpy)

def lock(name, mat, base, direction, length, r, parent, bend=0.0, lumpy=0.004):
    """Teardrop hair lock / tuft from base along direction."""
    prof = [(0, r * 0.75, r * 0.6), (length * 0.25, r, r * 0.8), (length * 0.6, r * 0.65, r * 0.5), (length, 0.004, 0.004)]
    bm = lathe_bm(prof, 16)
    if bend:
        for v in bm.verts:
            v.co.y += bend * (v.co.z / length) ** 2 * length
    ob = _finish(name, bm, mat, parent, base, (0, 0, 0), lumpy)
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized())
    return ob

def head_bm(R, sx=1.0, sy=1.0, sz=1.15, jaw=0.25, chin=0.08, cheek=0.06, back=0.05, p=2.0):
    """Head: a superellipsoid (p > 2 squares it off toward a rounded rectangle), tapered jaw, chin, cheeks."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=40, radius=1)
    for v in bm.verts:
        x, y, z = v.co
        k = (abs(x) ** p + abs(y) ** p + abs(z) ** p) ** (-1 / p)
        x, y, z = x * k, y * k, z * k
        if z < 0:
            x *= 1 - jaw * (-z) ** 1.5
            if y < 0: y -= chin * max(0, -z - 0.55) * 2.0
        x *= 1 + cheek * math.exp(-((z + 0.25) / 0.3) ** 2) * (1 if y < 0.2 else 0.5)
        if y > 0: y *= 1 - back
        v.co = Vector((x * R * sx, y * R * sy, z * R * sz))
    bm.normal_update()
    return bm

def hemi(name, mat, r, parent, loc):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=r)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -r * 0.15], context='VERTS')
    ob = _finish(name, bm, mat, parent, loc, (0, 0, 0), 0)
    s = ob.modifiers.new('thick', 'SOLIDIFY'); s.thickness = r * 0.12
    return ob

def aim(ob, normal):
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(normal))


def strand(name, mat, pts, r, parent, taper=(1.0, 0.95, 0.75, 0.4, 0.08)):
    """A tapered clay lock along points (hair). Thick at the root, pointed at the tip."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 3; cu.use_fill_caps = True; cu.resolution_u = 6
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1)
    sp.use_endpoint_u = True; sp.order_u = min(4, len(pts))
    for i, (p, c) in enumerate(zip(sp.points, pts)):
        p.co = (*c, 1)
        k = i / (len(pts) - 1) * (len(taper) - 1)
        a = int(k); f = k - a
        p.radius = taper[a] * (1 - f) + taper[min(a + 1, len(taper) - 1)] * f
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    cu.materials.append(mat); ob.parent = parent
    ob.scale = (1, 1, 1)
    return ob

def scalp(hc, R, S, th, ph, k=1.0):
    """Point on the head ellipsoid at azimuth th (0 = back, pi = face) and polar angle ph (0 = top)."""
    return hc + Vector((math.sin(ph) * math.sin(th) * R * S[0], math.sin(ph) * math.cos(th) * R * S[1], math.cos(ph) * R * S[2])) * k


def shadow_skin(color, R, S):
    from lib import hexcol
    m = clay(color, sss=0.12, bump=0.22).copy(); m.name = 'skin_shadow'
    N = m.node_tree.nodes; L = m.node_tree.links
    b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    mr = N.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -0.28 * R * S[2]; mr.inputs['From Max'].default_value = -0.45 * R * S[2]
    L.new(sep.outputs['Z'], mr.inputs['Value'])
    front = N.new('ShaderNodeMapRange'); front.inputs['From Min'].default_value = 0.2 * R; front.inputs['From Max'].default_value = -0.4 * R
    L.new(sep.outputs['Y'], front.inputs['Value'])
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L.new(mr.outputs[0], mul.inputs[0]); L.new(front.outputs[0], mul.inputs[1])
    grain = N.new('ShaderNodeTexNoise'); grain.inputs['Scale'].default_value = 900
    mul2 = N.new('ShaderNodeMath'); mul2.operation = 'MULTIPLY'; L.new(mul.outputs[0], mul2.inputs[0]); L.new(grain.outputs['Fac'], mul2.inputs[1])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*hexcol(color), 1); mix.inputs['B'].default_value = (*hexcol('#9c8a80'), 1)
    sc = N.new('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = 1.0
    L.new(mul2.outputs[0], sc.inputs[0]); L.new(sc.outputs[0], mix.inputs['Factor'])
    L.new(mix.outputs['Result'], b.inputs['Base Color'])
    return m

def beard_mat(color):
    """Tooled clay: fine directional strokes, like a beard combed with a sculpting tool."""
    from lib import hexcol
    m = bpy.data.materials.new('beard'); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.75
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (60, 60, 14)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    wv = N.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'; wv.inputs['Distortion'].default_value = 6; wv.inputs['Detail'].default_value = 3
    L.new(mp.outputs['Vector'], wv.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 130
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*hexcol(color), 1); mix.inputs['B'].default_value = (*hexcol('#8a7868'), 1)
    gate = N.new('ShaderNodeMapRange'); gate.inputs['From Min'].default_value = 0.56; gate.inputs['From Max'].default_value = 0.66
    L.new(nz.outputs['Fac'], gate.inputs['Value']); L.new(gate.outputs[0], mix.inputs['Factor'])
    L.new(mix.outputs['Result'], b.inputs['Base Color'])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.8; bp.inputs['Distance'].default_value = 0.004
    L.new(wv.outputs['Fac'], bp.inputs['Height']); L.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def frame_ring(name, mat, w, h, r, parent, loc, p=4.0, n=64):
    """Closed rounded-square wire (glasses frame): a superellipse path with a round section."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new('POLY'); sp.points.add(n - 1); sp.use_cyclic_u = True
    for i, pt in enumerate(sp.points):
        a = i / n * 2 * math.pi
        c, s_ = math.cos(a), math.sin(a)
        pt.co = (w / 2 * math.copysign(abs(c) ** (2 / p), c), 0, h / 2 * math.copysign(abs(s_) ** (2 / p), s_), 1)
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    cu.materials.append(mat); ob.parent = parent; ob.location = loc
    return ob

CAST = {
    'noah': dict(height=1.2, hip=0.5, leg=0.46, legr=0.055, head=0.15, headS=(0.86, 0.9, 1.36), headP=2.5, jaw=0.12, chin=0.02, cheek=0.05,
                 skin='#eab98f', hair='#5b3a22', iris='#2f7fd0', shirt='#1f4f9e', bottom='#6a6620', shoes='#7b4a29', socks='#efe9dc',
                 cape='#e01b1b', torso=[(-0.06, 0.135, 0.1), (0.06, 0.14, 0.105), (0.2, 0.135, 0.1), (0.3, 0.15, 0.1), (0.36, 0.13, 0.09), (0.4, 0.05, 0.045)],
                 shoulder=0.125, sz=0.33, up=0.2, fore=0.18, armr=0.042, hand=0.042, eye=0.032, eyeX=0.056, eyeZ=0.02, mouthZ=0.34, nose=(0.018, 0.016, 0.014)),
    'lu':   dict(height=1.85, hip=0.95, leg=0.88, legr=0.062, head=0.14, headS=(0.76, 0.9, 1.5), headP=3.0, jaw=0.05, chin=0.03, cheek=0.0,
                 skin='#e7b287', hair='#1f1b19', iris='#2a1d14', shirt='#f8f4ea', bottom='#1d1f23', shoes='#b9bcbf', sole='#f2f2ee',
                 frames='#8a6a3e', shadow=True,
                 torso=[(-0.08, 0.17, 0.11), (0.05, 0.17, 0.11), (0.25, 0.165, 0.11), (0.45, 0.2, 0.12), (0.53, 0.18, 0.11), (0.58, 0.06, 0.055)],
                 shoulder=0.185, sz=0.5, up=0.3, fore=0.28, armr=0.046, hand=0.05, eye=0.025, eyeX=0.048, eyeZ=0.035, mouthZ=0.4, eyeSquash=0.8, nose=(0.016, 0.02, 0.026)),
    'boss': dict(height=1.75, hip=0.86, leg=0.8, legr=0.085, head=0.15, headS=(0.86, 0.95, 1.4), headP=3.2, jaw=0.03, chin=0.03, cheek=0.03,
                 skin='#d9a476', hair='#8a6c52', shirt='#33702b', bottom='#8a8d92', shoes='#4a4d52', sole='#d8d6d0', beanie='#2b2927',
                 shades='#0c0c0c', beard='#a39c93', torso=[(-0.08, 0.24, 0.17), (0.08, 0.26, 0.19), (0.25, 0.25, 0.17), (0.42, 0.26, 0.15), (0.5, 0.22, 0.13), (0.56, 0.07, 0.065)],
                 shoulder=0.235, sz=0.47, up=0.29, fore=0.27, armr=0.055, hand=0.055, eye=0.03, eyeX=0.054, eyeZ=0.04, mouthZ=0.42, nose=(0.026, 0.026, 0.026)),
}


class Clay:
    def __init__(self, who, parent=None):
        c = CAST[who]; self.who = who; self.c = c
        rnd = random.Random(who)
        skin = clay(c['skin'], sss=0.12, bump=0.22)
        shirt = clay(c['shirt'], bump=0.35)
        bottom = clay(c['bottom'], bump=0.4)
        self.root = empty(who, parent)
        self.hips = empty(who + '.hips', self.root, (0, 0, c['hip']))
        self.d = {'hip': c['hip']}
        # ---- legs: tapered sausage, sock/cuff, shoe with sole
        self.leg = {}
        hx = c['torso'][0][1] * 0.48
        for side, sx in (('L', 1), ('R', -1)):
            p = empty(f'{who}.leg{side}', self.hips, (sx * hx, 0, 0))
            L, r = c['leg'], c['legr']
            if who == 'noah':
                lathe(f'{who}.shortleg{side}', bottom, [(-0.2, r * 1.75, r * 1.75), (-0.05, r * 1.8, r * 1.8), (0.04, r * 1.6, r * 1.6)], p)
                lathe(f'{who}.shin{side}', skin, [(-L + 0.05, r * 0.85, r * 0.85), (-L * 0.55, r * 1.0, r * 1.05), (-0.25, r * 0.95, r * 0.95), (-0.12, r, r)], p)
                lathe(f'{who}.sock{side}', clay(c['socks'], bump=0.6), [(-L + 0.02, r * 0.95, r * 0.95), (-L + 0.09, r * 1.0, r * 1.0)], p)
            elif who == 'lu':
                lathe(f'{who}.trouser{side}', bottom, [(-L + 0.04, r * 0.95, r * 0.95), (-L * 0.5, r * 1.05, r * 1.1), (-0.15, r * 1.35, r * 1.4), (0.04, r * 1.4, r * 1.4)], p)
            else:  # baggy sweatpants with an elastic cuff
                lathe(f'{who}.sweat{side}', bottom, [(-L + 0.08, r * 0.85, r * 0.85), (-L + 0.14, r * 1.1, r * 1.1), (-L * 0.55, r * 1.25, r * 1.3), (-0.12, r * 1.45, r * 1.45), (0.05, r * 1.4, r * 1.4)], p, lumpy=0.008)
                torus(f'{who}.cuff{side}', clay('#7f8184', bump=0.6), r * 0.9, 0.018, p, (0, 0, -L + 0.07), (math.pi / 2, 0, 0))
            # shoe
            sh = c['shoes']; fl = r * 2.3
            blob(f'{who}.shoe{side}', clay(sh, rough=0.5, bump=0.3), (r * 1.25, fl, r * 0.85), (0, -fl * 0.45, -L + 0.0), p, lumpy=0.003)
            blob(f'{who}.sole{side}', clay(c.get('sole', '#3b2a1c'), bump=0.2), (r * 1.3, fl * 1.05, 0.014), (0, -fl * 0.45, -L - 0.04), p, lumpy=0)
            self.leg[side] = p
        # ---- torso (shirt), waistband, logo
        self.torso = empty(who + '.torso', self.hips)
        prof = [(z, rx, ry) for z, rx, ry in c['torso']]
        self.shirtOb = lathe(who + '.shirt', shirt, prof, self.torso, lumpy=0.004, p=2.6)
        lathe(who + '.waist', bottom, [(prof[0][0] - 0.07, prof[0][1] * 0.97, prof[0][2] * 0.97), (prof[0][0] - 0.03, prof[0][1] * 0.98, prof[0][2] * 0.98), (prof[0][0] + 0.01, prof[0][1] * 0.96, prof[0][2] * 0.96)], self.torso, p=2.6)
        if who == 'boss':
            band = torus(who + '.band', clay('#7f8184', bump=0.6), prof[0][1] * 1.03, 0.02, self.torso, (0, 0, -0.07), (math.pi / 2, 0, 0))
            band.scale = (1, 1, prof[0][2] / prof[0][1])
        bvh = BVHTree.FromObject(self.shirtOb, bpy.context.evaluated_depsgraph_get())
        def on_shirt(x, z, back=False):
            hit = bvh.ray_cast(Vector((x, 1 if back else -1, z)), Vector((0, -1 if back else 1, 0)))
            return hit[0], hit[1]
        if who == 'lu':
            cols = ['#2f6fd0', '#1d1d1d', '#d23a2a', '#e8b52a', '#2f9a4a']
            for i, (x, z) in enumerate([(-0.05, 0.4), (0, 0.4), (0.05, 0.4), (-0.025, 0.375), (0.025, 0.375)]):
                p, n = on_shirt(x, z)
                ob = torus(f'{who}.ring{i}', clay(cols[i], bump=0.05), 0.02, 0.0045, self.torso, p + n * 0.003)
                ob.rotation_mode = 'QUATERNION'; ob.rotation_quaternion = Vector((0, -1, 0)).rotation_difference(n)
        if who == 'noah':  # little hot tub with steam: Noah's hot tub business
            p, n = on_shirt(0.045, 0.27)
            g = empty(who + '.logo', self.torso, p + n * 0.004)
            g.rotation_mode = 'QUATERNION'; g.rotation_quaternion = Vector((0, -1, 0)).rotation_difference(n)
            box(who + '.tub', clay('#8a5a33', bump=0.3), (0.06, 0.008, 0.026), (0, 0, 0), g, bevel=0.006)
            for k in range(3):
                box(f'{who}.stave{k}', clay('#6e4526', bump=0.2), (0.003, 0.004, 0.024), (0, 0, 0), g, loc=(-0.018 + k * 0.018, -0.005, 0), bevel=0)
            blob(who + '.water', clay('#4fb3d9', rough=0.25, bump=0.05), (0.028, 0.004, 0.006), (0, 0, 0), g, loc=(0, -0.002, 0.014), lumpy=0)
            for k in range(3):
                x0 = -0.015 + k * 0.015
                snake(f'{who}.steam{k}', clay('#f4f4f0', bump=0.05), [(x0, 0, 0.022), (x0 + 0.005, 0, 0.03), (x0 - 0.003, 0, 0.038), (x0 + 0.004, 0, 0.046)], 0.0022, g, (0, -0.003, 0))
        if who == 'boss':  # the old green tee, shredding: holes with frayed rims, skin showing
            for i, (x, z, back, r) in enumerate([(0.13, 0.11, False, 0.028), (0.18, 0.05, False, 0.017), (0.09, 0.03, False, 0.014),
                                                 (0.17, 0.17, False, 0.012), (0.07, 0.12, False, 0.009), (0.12, 0.2, False, 0.008)]):
                p, n = on_shirt(x, z, back)
                if p is None: continue
                d = blob(f'{who}.hole{i}', clay('#a87a55', sss=0.1, bump=0.3), (r, r * 0.8, 0.004), (0, 0, 0), self.torso, loc=p + n * 0.001, lumpy=0); aim(d, n)
                rim = torus(f'{who}.fray{i}', clay('#46603a', bump=0.9), r, 0.006, self.torso, p + n * 0.002, lumpy=0.004)
                rim.rotation_mode = 'QUATERNION'; rim.rotation_quaternion = Vector((0, -1, 0)).rotation_difference(n)
                rim.scale = (1, 1, 0.8)
            # a frayed hem
            for k in range(14):
                a = k / 14 * 2 * math.pi
                blob(f'{who}.hem{k}', shirt, (0.02, 0.008, 0.022), (0, 0, 0), self.torso,
                     loc=(math.cos(a) * prof[0][1] * 1.0, math.sin(a) * prof[0][2] * 1.0, prof[0][0] + 0.005 + rnd.uniform(-0.01, 0.01)), lumpy=0.004)
        # ---- arms: shoulder -> sleeve + upper arm -> elbow -> forearm -> hand with fingers
        self.arm = {}; self.hand = {}
        top = prof[-2][0]
        for side, sx in (('L', 1), ('R', -1)):
            sh = empty(f'{who}.shoulder{side}', self.torso, (sx * c['shoulder'], 0, c['sz']))
            r = c['armr']; up = c['up']
            lathe(f'{who}.upper{side}', skin, [(-up - 0.02, r * 0.9, r * 0.9), (-up * 0.5, r * 1.1, r * 1.1), (0.0, r * 1.15, r * 1.15)], sh)
            lathe(f'{who}.sleeve{side}', shirt, [(-up * 0.5, r * 1.55, r * 1.55), (-up * 0.3, r * 1.6, r * 1.6), (0.02, r * 1.8, r * 1.7), (0.05, r * 0.8, r * 0.8)], sh, lumpy=0.004)
            el = empty(f'{who}.elbow{side}', sh, (0, 0, -up))
            fo = c['fore']
            lathe(f'{who}.fore{side}', skin, [(-fo, r * 0.75, r * 0.7), (-fo * 0.4, r * 0.95, r * 0.95), (0.02, r * 0.95, r * 0.95)], el)
            h = empty(f'{who}.hand{side}', el, (0, 0, -fo - c['hand'] * 0.5))
            hs = c['hand']
            blob(f'{who}.palm{side}', skin, (hs * 0.85, hs * 0.45, hs * 0.8), (0, 0, 0), h)
            for k in range(4):
                fx = (k - 1.5) * hs * 0.42
                lathe(f'{who}.finger{side}{k}', skin, [(-hs * (1.45 - abs(k - 1.5) * 0.18), hs * 0.12, hs * 0.12), (-hs * 1.2, hs * 0.18, hs * 0.17), (-hs * 0.5, hs * 0.2, hs * 0.18)], h, loc=(fx * -sx, 0, 0), seg=12)
            blob(f'{who}.thumb{side}', skin, (hs * 0.22, hs * 0.2, hs * 0.5), (0, 0, -hs * 0.4), h, loc=(sx * -hs * 0.8, -hs * 0.25, 0.0), rot=(0, sx * 0.6, 0))
            self.arm[side] = (sh, el); self.hand[side] = h
        # ---- neck + head
        R = c['head']; S = c['headS']
        self.neck = empty(who + '.neck', self.torso, (0, 0, prof[-1][0] - 0.02))
        lathe(who + '.neckb', skin, [(-0.04, 0.045 if who != 'boss' else 0.06, 0.045), (0.06, 0.042 if who != 'boss' else 0.058, 0.042)], self.neck)
        self.head = empty(who + '.head', self.neck, (0, 0, 0.05))
        hc = Vector((0, 0, R * S[2] * 0.95)); self.hc = hc; self.R = R
        self.hp = dict(jaw=c['jaw'], chin=c['chin'], cheek=c['cheek'], p=c.get('headP', 2.0))
        bm = head_bm(R, *S, **self.hp)
        hbvh = BVHTree.FromBMesh(bm); self.hbvh = hbvh
        self.skull = _finish(who + '.skull', bm, skin, self.head, hc, (0, 0, 0), 0.002)
        def surf(x, z):
            hit = hbvh.ray_cast(Vector((x, -5, z)), Vector((0, 1, 0)))
            return (hit[0] + hc, hit[1]) if hit[0] else (None, None)
        self.surf = surf
        def scalp_(th, ph, k=1.0):
            d = Vector((math.sin(ph) * math.sin(th), math.sin(ph) * math.cos(th), math.cos(ph)))
            hit = hbvh.ray_cast(Vector((0, 0, 0)), d)
            return hc + d * (hit[3] if hit[0] else R) * k
        self.scalp = scalp_
        if c.get('shadow'):  # Lu's five o'clock shadow: the skin greys a little below the nose
            self.skull.data.materials[0] = shadow_skin(c['skin'], R, S)
        # nose, ears
        p, n = surf(0, -R * 0.12)
        nr = c['nose']
        blob(who + '.nose', skin, nr, (0, -nr[1] * 0.3, -nr[2] * 0.2), self.head, loc=p)
        for side, sx in (('L', 1), ('R', -1)):
            blob(f'{who}.ear{side}', skin, (R * 0.12, R * 0.07, R * 0.22), (0, 0, 0), self.head, loc=hc + Vector((sx * R * S[0] * 0.97, R * 0.05, -R * 0.08)), rot=(0, 0, sx * -0.3))
        # eyes: eyeball + iris + pupil + glint inside a pivot that rotates to look; a lid that rotates to blink
        self.eye = {}; self.eyeRot = {}; self.lid = {}; self.brow = {}
        er = c['eye']
        lidm = skin
        for side, sx in (('L', 1), ('R', -1)):
            p, n = surf(sx * c['eyeX'], c['eyeZ'])
            ctr = p + Vector((0, er * 0.45, 0))
            e = empty(f'{who}.eyeP{side}', self.head, ctr)
            e.scale = (1, 1, c.get('eyeSquash', 1.0))
            if who != 'boss':
                blob(f'{who}.ball{side}', clay('#fbf8f0', rough=0.3, bump=0.03, prints=0.2), (er, er, er), (0, 0, 0), e, lumpy=0)
                rot = empty(f'{who}.eyeR{side}', e)
                iris = blob(f'{who}.iris{side}', clay(c['iris'], rough=0.25, bump=0.02, prints=0), (er * 0.62, er * 0.22, er * 0.62), (0, 0, 0), rot, loc=(0, -er * 0.86, 0), lumpy=0)
                blob(f'{who}.pupil{side}', clay('#0d0a08', rough=0.15, bump=0.0, prints=0), (er * 0.3, er * 0.1, er * 0.3), (0, 0, 0), iris, loc=(0, -er * 0.13, 0), lumpy=0)
                blob(f'{who}.glint{side}', flat('#ffffff', 3.0), (er * 0.11, er * 0.05, er * 0.11), (0, 0, 0), iris, loc=(er * 0.2, -er * 0.2, er * 0.22), lumpy=0)
                lid = empty(f'{who}.lidP{side}', e)
                hemi(f'{who}.lid{side}', lidm, er * 1.08, lid, (0, 0, 0))
                self.eyeRot[side] = rot; self.lid[side] = lid
            self.eye[side] = e
            bp, bn = surf(sx * c['eyeX'], c['eyeZ'] + er * 1.9)
            b = empty(f'{who}.browP{side}', self.head, bp + bn * 0.004)
            bw = er * 1.25
            snake(f'{who}.brow{side}', clay(c['hair'] if who != 'boss' else '#6b5442', bump=0.6),
                  [(-bw, 0, -er * 0.15), (-bw * 0.3, 0, er * 0.12), (bw * 0.5, 0, er * 0.12), (bw, 0, -er * 0.05)], er * (0.22 if who == 'boss' else 0.17), b)
            self.brow[side] = b
            if who == 'boss':
                for ch in b.children: ch.hide_render = True
        self.er = er
        # mouth
        mz = -R * S[2] * c.get('mouthZ', 0.48)
        p, n = surf(0, mz)
        self.mouthP = empty(who + '.mouthP', self.head, p + Vector((0, 0.004, 0)))
        self.mouthOpen = blob(who + '.mouth', clay('#5a1f1c', rough=0.5, bump=0.05, prints=0), (R * 0.26, R * 0.1, R * 0.17), (0, 0, 0), self.mouthP, lumpy=0)
        self.teeth = blob(who + '.teeth', clay('#f6f3ea', rough=0.35, bump=0.02, prints=0), (R * 0.2, R * 0.05, R * 0.045), (0, -R * 0.07, R * 0.1), self.mouthOpen, lumpy=0)
        self.tongue = blob(who + '.tongue', clay('#c95d57', bump=0.05, prints=0), (R * 0.14, R * 0.06, R * 0.06), (0, -R * 0.03, -R * 0.09), self.mouthOpen, lumpy=0)
        self.smile = torus(who + '.smile', clay('#6a2a24', rough=0.5, bump=0.05, prints=0), R * 0.24, 0.0055, self.mouthP, (0, -0.004, R * 0.17), arc=0.3)
        # hair / hats
        if who == 'noah': self._hair_noah(rnd)
        if who == 'lu': self._hair_lu(rnd)
        if who == 'boss': self._boss_head(rnd)
        if who == 'lu':
            gm = clay(c['frames'], rough=0.3, bump=0.03, prints=0)
            for side, sx in (('L', 1), ('R', -1)):
                ep = self.eye[side].location
                frame_ring(f'{who}.lens{side}', gm, er * 3.3, er * 2.5, 0.0035, self.head, (ep.x, -R * 1.0 - 0.012, ep.z))
                blob(f'{who}.temple{side}', gm, (0.0035, R * 0.55, 0.0035), (0, 0, 0), self.head, loc=(sx * (abs(ep.x) + er * 1.65), -R * 0.5, ep.z + er * 0.9))
            snake(who + '.bridge', gm, [(-0.02, 0, 0), (0, 0, 0.006), (0.02, 0, 0)], 0.0035, self.head, (0, -R * 1.0 - 0.012, self.eye['L'].location.z + 0.004))
        if who == 'noah': self._cape()

    def _hair_noah(self, rnd):
        """Shaggy brown hair: a cap plus tapered locks flowing from the crown; the fringe falls to the brows."""
        R, hc, S = self.R, self.hc, self.c['headS']
        hm = clay(self.c['hair'], rough=0.6, bump=0.55, prints=1.2)
        top = R * S[2]
        self._shell('noah.cap', hm, lambda x, y, z: z > (0.5 * top if y < -0.45 * R * S[1] else -0.05 * top if y < 0.3 * R else -0.35 * top), 0.002, 0.014, 0.004)
        crown = (0.0, 0.12)
        n = 0
        for row, (ph1, k) in enumerate([(0.6, 1.08), (0.75, 1.06), (0.9, 1.03)]):
            count = 9 + row * 3
            for i in range(count):
                th = (i + rnd.uniform(-0.3, 0.3) + row * 0.5) / count * 2 * math.pi
                face = math.cos(th) < -0.55          # front of the head
                end_ph = (0.39 + rnd.uniform(-0.03, 0.03)) * math.pi if face else (0.5 + 0.17 * max(0.0, math.cos(th))) * math.pi
                pts = []
                for t in (0, 0.33, 0.66, 1.0):
                    ph = crown[1] * math.pi + (end_ph - crown[1] * math.pi) * t
                    kk = k + 0.06 * math.sin(t * math.pi) + (0.05 * t if not face else 0.0)
                    pts.append(self.scalp(th + rnd.uniform(-0.05, 0.05) * t, ph, kk))
                # tips flick out a little
                tip = pts[-1] + (pts[-1] - hc).normalized() * R * 0.08 + Vector((0, 0, -R * 0.05))
                pts.append(tip)
                strand(f'noah.lock{n}', hm, pts, R * rnd.uniform(0.17, 0.21), self.head)
                n += 1
        for i, (th, l) in enumerate([(0.3, 0.45), (-0.4, 0.38), (0.05, 0.5)]):  # a few strands sticking up at the crown
            b0 = self.scalp(th, 0.18 * math.pi, 1.0)
            strand(f'noah.cowlick{i}', hm, [b0, b0 + Vector((math.sin(th) * 0.3, 0.4, 1)).normalized() * R * l * 0.5,
                                             b0 + Vector((math.sin(th) * 0.6, 0.9, 0.9)).normalized() * R * l], R * 0.08, self.head)

    def _hair_lu(self, rnd):
        """Black hair, short at the sides, the top swept up and back from the hairline."""
        R, hc, S = self.R, self.hc, self.c['headS']
        hm = clay(self.c['hair'], rough=0.5, bump=0.5, prints=1.0)
        top = R * S[2]
        self._shell('lu.cap', hm, lambda x, y, z: z > (0.66 * top if y < -0.45 * R * S[1] else 0.12 * top if y < 0.3 * R else -0.15 * top), 0.002, 0.01, 0.003)
        n = 0
        for row in range(3):  # quiff: up from the hairline, then back over the crown
            count = 7
            for i in range(count):
                x = (i / (count - 1) - 0.5) * 1.3 * R * S[0] * (1 - row * 0.15)
                z0 = top * (0.68 + row * 0.13)
                sp, _ = self.surf(x, z0)
                if sp is None: continue
                y0 = sp.y + R * 0.02 + row * R * 0.18
                lift = R * (0.42 - row * 0.1) * (1 - abs(x) / (R * 1.4))
                pts = [hc + Vector((x, y0, z0)),
                       hc + Vector((x * 1.05, y0 - R * 0.05, z0 + lift * 0.8)),
                       hc + Vector((x * 1.05, y0 + R * 0.25, top + lift * 0.6)),
                       hc + Vector((x * 0.9, R * 0.45, top * 0.85)),
                       hc + Vector((x * 0.8, R * 0.85, top * 0.45))]
                strand(f'lu.top{n}', hm, pts, R * 0.16, self.head, taper=(0.8, 1.0, 0.95, 0.6, 0.15)); n += 1
        for i in range(18):  # short sides and back
            th = i / 18 * 2 * math.pi
            if math.cos(th) < -0.6: continue
            pts = [self.scalp(th, (0.25 + t * (0.17 + 0.14 * max(0.0, math.cos(th)))) * math.pi, 1.03) for t in (0, 0.5, 1.0)]
            strand(f'lu.side{i}', hm, pts, R * 0.11, self.head, taper=(1.0, 0.8, 0.3)); n += 1

    def _boss_head(self, rnd):
        R, hc, S, c = self.R, self.hc, self.c['headS'], self.c
        bean = clay(c['beanie'], rough=0.85, bump=0.9, prints=0.6)
        top = R * S[2]
        self._shell('boss.beanie', bean, lambda x, y, z: z > 0.4 * top, 0.006, 0.02, 0.0)
        # folded cuff: a smooth, even band following the head's cross-section (no notches)
        hp = self.hp['p']
        def ring(zf, out):
            f = (1 - abs(zf * top / (R * S[2])) ** hp) ** (1 / hp)
            return (zf * top, R * S[0] * f + out, R * S[1] * f * 0.985 + out)
        z0, z1 = 0.3, 0.52
        cuff_prof = [ring(z0, 0.02), ring(z0 + 0.03, 0.036), ring((z0 + z1) / 2, 0.04), ring(z1 - 0.03, 0.036), ring(z1, 0.02)]
        lathe('boss.cuff', bean, cuff_prof, self.head, loc=hc + Vector((0, -R * S[1] * 0.012, 0)), lumpy=0.0, seg=64, p=hp)
        # sunglasses: one glossy wraparound wayfarer piece, flat top, two lenses, notch at the bridge
        sm = clay(c['shades'], rough=0.06, bump=0.0, prints=0)
        zc = c['eyeZ']
        def hug(a, z, out):
            d = Vector((math.sin(a), -math.cos(a), 0))
            hit = self.hbvh.ray_cast(Vector((0, 0, z)), d)
            return Vector((0, 0, z)) + d * ((hit[3] if hit[0] else R) + out) + hc
        bmg = bmesh.new(); cols_, rows_ = 48, 6; A = 1.2
        def lo(a):
            aa = abs(a)
            if aa < 0.1: return zc + 0.012
            if aa < 0.85:
                t = (aa - 0.1) / 0.75
                return zc + 0.012 - 0.05 * math.sin(math.pi * min(1, t)) ** 0.55 - 0.006 * (1 - t)
            return zc + 0.032
        grid = []
        for i in range(cols_ + 1):
            a = -A + 2 * A * i / cols_
            hi = zc + 0.044 + 0.004 * abs(a)
            grid.append([bmg.verts.new(hug(a, lo(a) + (hi - lo(a)) * j / rows_, 0.014 + 0.004 * abs(a))) for j in range(rows_ + 1)])
        for i in range(cols_):
            for j in range(rows_):
                bmg.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
        bmg.normal_update()
        sh_ = _finish('boss.shades', bmg, sm, self.head, (0, 0, 0), (0, 0, 0), 0)
        so = sh_.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.007; so.offset = 0
        bv = sh_.modifiers.new('round', 'BEVEL'); bv.width = 0.002; bv.segments = 2
        for side, sx in (('L', 1), ('R', -1)):
            ep = hug(sx * A, zc + 0.04, 0.012)
            blob(f'boss.arm{side}', sm, (0.004, R * 0.5, 0.006), (0, 0, 0), self.head, loc=(ep.x, ep.y + R * 0.45, ep.z))
        # beard: a shell cut from the head shape, pushed out and textured like tooled clay
        bm_ = beard_mat(c['beard'])
        mz = self.mouthP.location.z - hc.z
        hb = head_bm(R, *S, **self.hp)
        def keep(v):
            x, y, z = v
            if y > 0.3 * R: return False
            if z > -0.05 * R * S[2]: return False
            if z > -0.38 * R * S[2] and abs(x) < 0.62 * R * S[0] and y < 0: return False   # bare cheeks above the moustache
            if (x / (0.3 * R)) ** 2 + ((z - mz) / (0.12 * R)) ** 2 < 1 and y < 0: return False  # mouth
            return True
        bmesh.ops.delete(hb, geom=[f for f in hb.faces if not keep(f.calc_center_median())], context='FACES')
        for v in hb.verts:
            v.co += v.normal * 0.006
        beard = _finish('boss.beard', hb, bm_, self.head, hc, (0, 0, 0), 0.0)
        so = beard.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.016; so.offset = 1
        beard.modifiers.new('sub', 'SUBSURF').levels = 1
        d = beard.modifiers.new('tufts', 'DISPLACE'); d.texture = bpy.data.textures.get('tufts') or bpy.data.textures.new('tufts', 'CLOUDS')
        d.texture.noise_scale = 0.06; d.strength = 0.012
        mz = mz + hc.z
        for k in range(10):  # moustache
            x = (k / 9 - 0.5) * 0.36 * R * 2
            hit = self._skull_hit(x, mz - hc.z + R * 0.13 - abs(x) * 0.35)
            if hit is None: continue
            p, n = hit
            blob(f'boss.stache{k}', bm_, (0.016, 0.012, 0.009), (0, 0, 0), self.head, loc=p + n * 0.008, rot=(0, (k / 9 - 0.5) * 0.8, 0), lumpy=0)

    def _shell(self, name, mat, keep, push=0.004, thick=0.012, lumpy=0.0):
        """A layer sculpted over part of the head (hair cap, beanie, beard): the head shape cut by keep(x, y, z)."""
        hb = head_bm(self.R, *self.c['headS'], **self.hp)
        bmesh.ops.delete(hb, geom=[f for f in hb.faces if not keep(*f.calc_center_median())], context='FACES')
        for v in hb.verts:
            v.co += v.normal * push
        ob = _finish(name, hb, mat, self.head, self.hc, (0, 0, 0), lumpy)
        so = ob.modifiers.new('thick', 'SOLIDIFY'); so.thickness = thick; so.offset = 1
        ob.modifiers.new('sub', 'SUBSURF').levels = 1
        return ob

    def _skull_hit(self, x, z):
        p, n = self.surf(x, z)
        return (p, n) if p is not None else None

    def _cape(self):
        """Red cape tied at the throat; pivot just behind the neck so it can lift and flap."""
        c = self.c
        self.cape = empty('noah.capeP', self.torso, (0, 0.06, c['torso'][-2][0]))
        bm = bmesh.new()
        W, H, cols_, rows_ = 0.3, 0.6, 14, 12
        vs = [[bm.verts.new(((u / cols_ - 0.5) * W * (1 + 0.8 * v / rows_),
                              0.05 * math.cos((u / cols_ - 0.5) * math.pi) * -1 + 0.06 * (v / rows_) + 0.012 * math.sin(u * 1.9 + v * 0.7),
                              -v / rows_ * H)) for u in range(cols_ + 1)] for v in range(rows_ + 1)]
        for v in range(rows_):
            for u in range(cols_):
                bm.faces.new((vs[v][u], vs[v][u + 1], vs[v + 1][u + 1], vs[v + 1][u]))
        cm = clay(c['cape'], bump=0.35)
        self.capeOb = _finish('noah.cape', bm, cm, self.cape, (0, 0, 0), (0, 0, 0), 0.0)
        so = self.capeOb.modifiers.new('thick', 'SOLIDIFY'); so.thickness = 0.014
        self.capeOb.modifiers.new('sub', 'SUBSURF').levels = 1
        lathe('noah.collar', cm, [(-0.03, 0.075, 0.07), (0.0, 0.08, 0.075), (0.02, 0.065, 0.06)], self.torso, loc=(0, 0.0, c['torso'][-2][0] + 0.03))
        blob('noah.knot', cm, (0.03, 0.022, 0.024), (0, 0, 0), self.torso, loc=(0, -0.085, c['torso'][-2][0] + 0.005))
        for side, sx in (('L', 1), ('R', -1)):
            lock(f'noah.tie{side}', cm, Vector((sx * 0.01, -0.09, c['torso'][-2][0] - 0.005)), (sx * 0.5, -0.3, -1), 0.07, 0.014, self.torso)

    # ------------------------------------------------------------------ posing
    def pose(self, x=0, y=0, rotz=0, bob=0, lean=0, legs=None, arms=None, head=None, cape=0, jitter=0, seed=0):
        rnd = random.Random(seed)
        j = lambda s=1.0: rnd.uniform(-1, 1) * jitter * s
        r = math.radians
        self.root.location = (x, y, 0); self.root.rotation_euler = (0, 0, r(rotz))
        self.hips.location = (0, 0, self.c['hip'] + bob)
        lx_, ly_ = (lean if isinstance(lean, tuple) else (0, lean))
        self.torso.rotation_euler = (r(lx_) + j(0.01), r(ly_) + j(0.01), 0)
        legs = legs or {}
        for s in 'LR':
            lg = legs.get(s, {})
            self.leg[s].rotation_euler = (r(-lg.get('fwd', 0)), r(lg.get('out', 0) * (-1 if s == 'L' else 1)), 0)
        arms = arms or {}
        for s in 'LR':
            a = arms.get(s, {}); sh, el = self.arm[s]
            sgn = -1 if s == 'L' else 1
            sh.rotation_euler = (r(-a.get('fwd', 0)) + j(0.02), r(sgn * a.get('out', 6)) + j(0.02), r(sgn * a.get('twist', 0)))
            el.rotation_euler = (r(-a.get('bend', 0)) + j(0.02), 0, 0)
            self.hand[s].rotation_euler = (r(a.get('wrist', 0)), 0, r(a.get('handTwist', 0)))
        h = head or {}
        self.head.rotation_euler = (r(h.get('nod', 0)) + j(0.01), r(-h.get('tilt', 0)) + j(0.01), r(h.get('turn', 0)) + j(0.01))
        lx, ly = h.get('lookX', 0), h.get('lookY', 0)
        lids = {'wide': -25, 'happy': 62, 'tired': 45, 'angry': 40}.get(h.get('eyes'), 18)
        lids = lids + (88 - lids) * h.get('blink', 0)
        for s in 'LR':
            if s in self.eyeRot:
                self.eyeRot[s].rotation_euler = (r(ly * 22), 0, r(lx * 28))
                self.lid[s].rotation_euler = (r(lids), 0, 0)
            b = self.brow[s]; sgn = 1 if s == 'L' else -1
            b.rotation_euler = (0, r(-sgn * h.get('browTilt', 0)), 0)
            b.delta_location = (0, 0, h.get('raise', 0) * self.er * 0.45)
        mouth = h.get('mouth', 'smile'); op = h.get('open', 0)
        self.smile.hide_render = mouth not in ('smile', 'grin', 'flat', 'frown')
        self.mouthOpen.hide_render = mouth in ('smile', 'flat', 'frown') and op < 0.05
        w = {'o': 0.55, 'talk': 0.85, 'grin': 1.25, 'yell': 1.0}.get(mouth, 0.9)
        self.mouthOpen.scale = (w, 1, max(0.12, op * (1.3 if mouth in ('o', 'yell') else 1.0)))
        self.teeth.hide_render = mouth not in ('grin', 'yell', 'talk') or op < 0.25
        self.smile.scale = {'grin': (1.2, 1, 1.1), 'flat': (0.8, 1, 0.2), 'frown': (0.8, 1, -0.7)}.get(mouth, (1, 1, 1))
        self.smile.location = (0, -0.004, self.R * (0.17 if mouth != 'frown' else 0.05))
        if hasattr(self, 'cape'):
            self.cape.rotation_euler = (r(14 + cape * 55) + j(0.02), 0, 0)
