# Clay props and sets for scenes 3-11: phone, the Boss's brown car, the backyard hot tub,
# the Korean BBQ restaurant. Same conventions as lib.py: metres, Z up, camera mostly looks along +Y.
import bpy, math, random
from mathutils import Vector
from lib import clay, flat, blob, box, cone, torus, empty, snake, hexcol
from cast import lathe
import sets as S


def puff(color='#f7f4ee', alpha=0.25):
    """Soft see-through clay for steam and smoke."""
    m = bpy.data.materials.new('puff'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexcol(color), 1); b.inputs['Roughness'].default_value = 0.9
    b.inputs['Alpha'].default_value = alpha
    return m


def phone(parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    g = empty('phone', parent, loc); g.rotation_euler = rot
    box('phone.body', clay('#25282c', rough=0.35, bump=0.05), (0.07, 0.012, 0.14), (0, 0, 0), g, bevel=0.012)
    box('phone.screen', flat('#5fa8e8', 0.6), (0.058, 0.004, 0.118), (0, -0.007, 0.002), g, bevel=0.004)
    return g


def ear_phone(person):
    """Phone held up beside the right ear, attached to the head (arms are too short to reach on their own),
    kept clear of the face so it reads on a small screen;
    pose the right arm with {'fwd': 80, 'out': 30, 'bend': 150} so the hand sits under it."""
    c = person.c; R = person.R; S_ = c['headS']
    return phone(person.head, person.hc + Vector((-R * S_[0] * 1.5, -0.08, -R * 0.2)), (math.radians(8), 0, math.radians(25)))


# ---------------------------------------------------------------- the Boss's car
class Car:
    """Boxy brown sedan, front toward -X. Driver sits on the car's left (-Y side). No glass: open window frames,
    so the cast can be seen inside. self.root moves/rotates the whole car; self.body rocks on the suspension."""
    def __init__(self, color='#7a4a2c'):
        self.root = empty('car')
        self.body = empty('car.body', self.root, (0, 0, 0))
        paint = clay(color, rough=0.45, bump=0.18, prints=0.6)
        dark = clay('#2a2826', bump=0.3); trim = clay('#b8bcc0', rough=0.3, bump=0.1)
        seat = clay('#c7a77e', bump=0.5); cabin = clay('#3a2f28', bump=0.4)
        b = self.body
        box('car.lower', paint, (4.3, 1.8, 0.55), (0, 0, 0.66), b, bevel=0.16)
        box('car.hood', paint, (1.3, 1.74, 0.12), (-1.45, 0, 0.96), b, bevel=0.06)
        box('car.trunk', paint, (0.9, 1.74, 0.12), (1.7, 0, 0.96), b, bevel=0.06)
        box('car.floor', cabin, (2.2, 1.6, 0.1), (0.15, 0, 0.66), b, bevel=0.02)
        box('car.dash', cabin, (0.35, 1.6, 0.25), (-0.85, 0, 1.08), b, bevel=0.05)
        # cabin frame: roof + pillars, open windows
        box('car.roof', paint, (2.0, 1.62, 0.09), (0.2, 0, 2.06), b, bevel=0.04)
        for side, y in (('L', -0.79), ('R', 0.79)):
            for name, x0, x1 in (('A', -0.95, -0.72), ('B', 0.18, 0.18), ('C', 1.15, 1.32)):
                p0, p1 = Vector((x0, y, 0.98)), Vector((x1 - 0.05 if name != 'B' else x1, y, 2.04))
                mid = (p0 + p1) / 2; d = p1 - p0
                ob = box(f'car.pillar{name}{side}', paint, (0.09, 0.07, d.length), (0, 0, 0), b, loc=mid, bevel=0.025)
                ob.rotation_euler = (0, math.atan2(d.x, d.z), 0)
            box(f'car.sill{side}', paint, (2.4, 0.07, 0.07), (0.15, y, 0.99), b, bevel=0.03)
            snake(f'car.door{side}', clay('#4d2f1c', bump=0.1), [(0.18, 0, 0.94), (0.18, 0, 0.45)], 0.008, b, (0, y * 1.14, 0))
            snake(f'car.door2{side}', clay('#4d2f1c', bump=0.1), [(-0.95, 0, 0.94), (-0.95, 0, 0.45)], 0.008, b, (0, y * 1.14, 0))
            box(f'car.handle{side}', trim, (0.16, 0.03, 0.04), (-0.55, y * 1.15, 0.82), b, bevel=0.012)
            box(f'car.mirror{side}', paint, (0.08, 0.14, 0.1), (-0.85, y * 1.18, 1.1), b, bevel=0.03)
        # bench seats
        box('car.seat', seat, (0.5, 1.5, 0.22), (-0.15, 0, 0.79), b, bevel=0.06)
        box('car.back', seat, (0.16, 1.5, 0.75), (0.18, 0, 1.2), b, bevel=0.06)
        box('car.rear', seat, (0.5, 1.5, 0.22), (0.85, 0, 0.79), b, bevel=0.06)
        self.wheel = torus('car.wheel', dark, 0.13, 0.05, b, (-0.62, -0.5, 1.28), (0, math.radians(-60), math.pi / 2))
        # nose: grille, headlights, bumpers; tail lights
        box('car.grille', dark, (0.05, 1.0, 0.2), (-2.16, 0, 0.72), b, bevel=0.02)
        for k in range(4):
            box(f'car.grilleBar{k}', trim, (0.03, 0.96, 0.018), (-2.19, 0, 0.65 + k * 0.045), b, bevel=0.005)
        for y in (-0.62, 0.62):
            blob(f'car.light{y}', clay('#f6e9b8', rough=0.2, bump=0.02, prints=0), (0.06, 0.24, 0.1), (-2.13, y, 0.76), b, lumpy=0)
            blob(f'car.tail{y}', clay('#c2271f', rough=0.25, bump=0.02, prints=0), (0.05, 0.18, 0.08), (2.14, y, 0.78), b, lumpy=0)
        box('car.bumperF', trim, (0.16, 1.86, 0.14), (-2.2, 0, 0.5), b, bevel=0.05)
        box('car.bumperR', trim, (0.16, 1.86, 0.14), (2.2, 0, 0.5), b, bevel=0.05)
        box('car.plate', clay('#efe9d6', bump=0.1), (0.02, 0.4, 0.13), (-2.29, 0, 0.5), b, bevel=0.01)
        # wheels (outside the rocking body)
        self.wheels = []
        for x in (-1.35, 1.35):
            for y in (-0.82, 0.82):
                w = empty(f'car.wheelP{x}{y}', self.root, (x, y, 0.36))
                w.rotation_euler = (math.pi / 2, 0, 0)
                torus(f'car.tyre{x}{y}', dark, 0.27, 0.1, w)
                cone(f'car.hub{x}{y}', trim, 0.17, 0.17, 0.2, (0, 0, -0.1), w, lumpy=0)
                for k in range(5):
                    a = k / 5 * 2 * math.pi
                    blob(f'car.nut{x}{y}{k}', dark, (0.02, 0.02, 0.02), (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.11 * (1 if y > 0 else -1)), w, lumpy=0)
                self.wheels.append(w)

    def seat(self, x, y, z=0.9):
        """An attach point on the bench seat; a cast member parented here sits facing forward (-X)."""
        e = empty(f'car.seat{x}{y}', self.body, (x, y, z)); e.rotation_euler = (0, 0, math.radians(-90))
        return e

    def pose(self, x=0, y=0, rotz=0, rock=0, pitch=0, spin=0):
        self.root.location = (x, y, 0); self.root.rotation_euler = (0, 0, math.radians(rotz))
        self.body.rotation_euler = (math.radians(rock), math.radians(pitch), 0)
        for w in self.wheels:
            w.rotation_euler = (math.pi / 2, 0, spin)


def sit(who, at, loc=(0, 0, 0), rotz=0, **kw):
    """A Clay cast member sitting with hips at `loc` (inside `at`), thighs forward: pose with legs fwd ~85, x=y=0."""
    from cast import Clay, CAST
    e = empty(f'{who}.sitP', at, (loc[0], loc[1], loc[2] - CAST[who]['hip'] + 0.05))
    e.rotation_euler = (0, 0, math.radians(rotz))
    return Clay(who, e, **kw)


# ---------------------------------------------------------------- backyard + hot tub
def backyard():
    S.world('#f2c79a', 0.8)
    S.backdrop(y=22, top='#e9a774', bottom='#f6dcb4')
    box('lawn', clay('#6f9a4f', bump=0.8, prints=2), (60, 40, 0.2), (0, 6, -0.1), bevel=0)
    box('patio', clay('#c9bba3', bump=0.5, prints=1.5), (8, 6, 0.06), (0, 0, 0.02), bevel=0.02)
    rnd = random.Random(7)
    for i in range(26):  # hedge of rounded bushes
        x = -13 + i * 1.05 + rnd.uniform(-0.2, 0.2)
        s = rnd.uniform(1.0, 1.5)
        blob(f'bush{i}', clay(rnd.choice(['#3f6e35', '#4a7a3b', '#36622e']), bump=0.9, prints=2), (s * 0.8, s * 0.7, s * 1.1), (0, 0, 0),
             loc=(x, 6 + rnd.uniform(-0.3, 0.3), s * 0.75), lumpy=0.12)
    for i in range(9):  # fence posts peeking through
        box(f'fence{i}', clay('#b48a5e', bump=0.6), (0.12, 0.12, 1.8), (0, 0, 0.9), loc=(-9 + i * 2.2, 5.2, 0), bevel=0.03)
    S.cloud('cloud0', -6, 20, 7, 1.2, rnd); S.cloud('cloud1', 7, 20, 8, 1.5, rnd)


class HotTub:
    """Round cedar tub with steel bands, steaming water and rising bubbles."""
    def __init__(self, loc=(0, 0, 0), R=1.25, H=0.95):
        self.root = empty('tub', None, loc); self.R, self.H = R, H
        wood = clay('#8a5a33', bump=0.6, prints=1.2); wood2 = clay('#7a4c2a', bump=0.6, prints=1.2)
        n = 40
        for k in range(n):
            a = k / n * 2 * math.pi
            ob = box(f'tub.stave{k}', wood if k % 2 else wood2, (0.2, 0.09, H), (0, 0, H / 2), self.root,
                     loc=(math.cos(a) * R, math.sin(a) * R, 0), rot=(0, 0, a + math.pi / 2), bevel=0.02)
        torus('tub.rim', wood, R + 0.02, 0.07, self.root, (0, 0, H), (math.pi / 2, 0, 0), seg=64)
        for z in (0.22, 0.7):
            torus(f'tub.band{z}', clay('#55595e', rough=0.35, bump=0.2), R + 0.055, 0.022, self.root, (0, 0, z), (math.pi / 2, 0, 0))
        self.wz = H - 0.12
        water = bpy.data.materials.new('water'); water.use_nodes = True
        bsdf = water.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Base Color'].default_value = (*hexcol('#3aa6c4'), 1); bsdf.inputs['Roughness'].default_value = 0.08
        bsdf.inputs['Coat Weight'].default_value = 0.6
        self.water = blob('tub.water', water, (R - 0.02, R - 0.02, 0.02), (0, 0, self.wz), self.root, lumpy=0.0, seg=48)
        rnd = random.Random(3)
        self.bubbles = []
        bm = clay('#dff3f6', rough=0.15, bump=0.02, prints=0)
        for i in range(26):
            a = rnd.uniform(0, 2 * math.pi); r = R * math.sqrt(rnd.uniform(0.05, 0.85))
            s = rnd.uniform(0.008, 0.018)
            ob = blob(f'tub.bubble{i}', bm, (s, s, s * 0.7), (0, 0, 0), self.root, loc=(math.cos(a) * r, math.sin(a) * r, self.wz), lumpy=0)
            self.bubbles.append((ob, rnd.uniform(0, 1), s))
        self.steam = []
        sm = puff()
        for i in range(8):
            a = i / 8 * 2 * math.pi + 0.3
            ob = blob(f'tub.steam{i}', sm, (0.07, 0.07, 0.05), (0, 0, 0), self.root, loc=(math.cos(a) * R * 0.6, math.sin(a) * R * 0.6, self.wz), lumpy=0.02)
            self.steam.append((ob, i / 8))

    def animate(self, t, boil=1.0):
        for ob, ph, s in self.bubbles:
            k = (t * 1.6 * boil + ph) % 1.0
            ob.scale = (1 + k * 0.6,) * 3
            ob.location.z = self.wz + 0.01 + math.sin(k * math.pi) * 0.04
            ob.hide_render = k > 0.92
        for ob, ph in self.steam:
            k = (t * 0.35 + ph) % 1.0
            ob.location.z = self.wz + 0.1 + k * 0.9
            ob.scale = (0.4 + k * 0.9,) * 3
            ob.hide_render = k > 0.85 or k < 0.05


# ---------------------------------------------------------------- Korean BBQ restaurant
class BBQ:
    """Booth with a tabletop grill: wood wall, red lanterns, menu board, pig posters, soju bottles, banchan."""
    def __init__(self):
        S.world('#3a2a1e', 0.3)
        wall = clay('#7a4a2a', bump=0.6, prints=1.5)
        box('bbq.wall', wall, (14, 0.3, 6), (0, 0, 3), loc=(0, 2.2, 0), bevel=0)
        for i in range(-7, 8):
            box(f'bbq.plank{i}', clay('#6a3e22', bump=0.5), (0.04, 0.05, 6), (0, 0, 3), loc=(i * 0.9, 2.04, 0), bevel=0)
        box('bbq.floor', clay('#4a3324', bump=0.5), (14, 8, 0.1), (0, 0, -0.05), bevel=0)
        # menu board with rows of "writing"
        box('bbq.menu', clay('#231d19', bump=0.2), (1.9, 0.06, 0.8), (0, 0, 0), loc=(0, 2.0, 2.55), bevel=0.03)
        box('bbq.menuFrame', clay('#b88a4a', bump=0.3), (2.0, 0.04, 0.9), (0, 0, 0), loc=(0, 2.03, 2.55), bevel=0.02)
        ink = clay('#efe6d0', bump=0.05)
        for r_ in range(3):
            for c_ in range(2):
                box(f'bbq.menuTxt{r_}{c_}', ink, (0.5, 0.02, 0.07), (0, 0, 0), loc=(-0.5 + c_ * 1.0, 1.96, 2.78 - r_ * 0.2), bevel=0.01)
        box('bbq.menuHead', clay('#e8b54a', bump=0.05), (0.5, 0.02, 0.08), (0, 0, 0), loc=(0, 1.96, 2.92), bevel=0.01)
        # pig posters
        for side, x in (('L', -2.6), ('R', 2.6)):
            box(f'bbq.poster{side}', clay('#f3ead2', bump=0.2), (0.9, 0.04, 1.1), (0, 0, 0), loc=(x, 2.03, 2.0), bevel=0.01)
            pig = clay('#f2a6b0', bump=0.25)
            blob(f'bbq.pig{side}', pig, (0.3, 0.06, 0.2), (0, 0, 0), loc=(x, 1.97, 2.05))
            blob(f'bbq.pigHead{side}', pig, (0.13, 0.06, 0.12), (0, 0, 0), loc=(x - 0.28 if side == 'L' else x + 0.28, 1.95, 2.12))
            blob(f'bbq.snout{side}', clay('#e48595', bump=0.1), (0.05, 0.03, 0.04), (0, 0, 0), loc=(x - 0.38 if side == 'L' else x + 0.38, 1.91, 2.1))
            for k in (-0.15, 0.15):
                cone(f'bbq.pigLeg{side}{k}', pig, 0.03, 0.025, 0.12, (0, 0, -0.12), loc=(x + k, 1.97, 1.92))
            box(f'bbq.posterTxt{side}', clay('#c23a2e', bump=0.05), (0.6, 0.02, 0.08), (0, 0, 0), loc=(x, 1.99, 1.6), bevel=0.01)
        # lanterns on strings: they sway
        self.lanterns = []
        red = clay('#d1302a', sss=0.2, bump=0.25); gold = clay('#c9a04a', rough=0.35, bump=0.1)
        for i, x in enumerate((-3.4, -1.6, 1.6, 3.4)):
            p = empty(f'bbq.lanternP{i}', None, (x, 1.6, 4.0))
            snake(f'bbq.string{i}', clay('#1d1a17'), [(0, 0, 0), (0, 0, -0.55)], 0.006, p)
            blob(f'bbq.lantern{i}', red, (0.26, 0.26, 0.3), (0, 0, -0.85), p, lumpy=0.01)
            for z in (-0.55, -1.15):
                cone(f'bbq.cap{i}{z}', gold, 0.12, 0.12, 0.05, (0, 0, z - 0.025), p, lumpy=0)
            for k in range(-2, 3):
                blob(f'bbq.rib{i}{k}', clay('#a8221c', bump=0.1), (0.008, 0.25 * math.cos(k * 0.5), 0.29), (k * 0.1, 0, -0.85), p, lumpy=0)
            self.lanterns.append((p, i * 1.3))
        # warm lights
        for i, x in enumerate((-3.4, -1.6, 1.6, 3.4)):
            L = bpy.data.lights.new(f'lamp{i}', 'POINT'); L.energy = 70; L.color = (1.0, 0.55, 0.35); L.shadow_soft_size = 0.4
            ob = bpy.data.objects.new(f'lamp{i}', L); bpy.context.scene.collection.objects.link(ob); ob.location = (x, 1.3, 3.0)
        key = bpy.data.lights.new('key', 'AREA'); key.energy = 900; key.size = 4; key.color = (1.0, 0.9, 0.78)
        ko = bpy.data.objects.new('key', key); bpy.context.scene.collection.objects.link(ko); ko.location = (-1.5, -4.5, 4.5)
        ko.rotation_euler = (Vector((0, 0.5, 1.0)) - ko.location).to_track_quat('-Z', 'Y').to_euler()
        # table, grill, meat, bottles, side dishes, cutlery
        self.tz = 0.78
        box('bbq.table', clay('#5a3a22', bump=0.5, prints=1.2), (3.6, 1.2, 0.08), (0, 0, self.tz - 0.04), loc=(0, -0.6, 0), bevel=0.03)
        box('bbq.tableFront', clay('#4e321d', bump=0.5), (3.6, 0.08, 0.7), (0, 0, self.tz - 0.4), loc=(0, -1.18, 0), bevel=0.02)
        tz = self.tz
        lathe('bbq.grill', clay('#2a2826', rough=0.4, bump=0.2), [(tz, 0.4, 0.4), (tz + 0.05, 0.42, 0.42), (tz + 0.07, 0.38, 0.38)], loc=(0, -0.6, 0))
        for k in range(1, 5):
            torus(f'bbq.grate{k}', clay('#6a6d70', rough=0.3, bump=0.1), 0.08 * k, 0.006, None, (0, -0.6, tz + 0.08), (math.pi / 2, 0, 0))
        snake('bbq.grateX', clay('#6a6d70', rough=0.3), [(-0.36, 0, 0), (0.36, 0, 0)], 0.006, None, (0, -0.6, tz + 0.08))
        snake('bbq.grateY', clay('#6a6d70', rough=0.3), [(0, -0.36, 0), (0, 0.36, 0)], 0.006, None, (0, -0.6, tz + 0.08))
        self.meat = []
        rnd = random.Random(11)
        for i in range(7):
            a = i / 7 * 2 * math.pi + 0.2; r = rnd.uniform(0.1, 0.27)
            g = empty(f'bbq.meatP{i}', None, (math.cos(a) * r, -0.6 + math.sin(a) * r, tz + 0.1))
            g.rotation_euler = (0, 0, rnd.uniform(0, math.pi))
            box(f'bbq.meat{i}', clay('#8a3a2a', bump=0.5), (0.2, 0.08, 0.025), (0, 0, 0), g, bevel=0.01, lumpy=0.004)
            box(f'bbq.fat{i}', clay('#e9d2bd', bump=0.3), (0.2, 0.02, 0.026), (0, 0.03, 0), g, bevel=0.008)
            self.meat.append((g, rnd.uniform(0, 6)))
        self.smoke = []
        sm = puff()
        for i in range(10):
            ob = blob(f'bbq.smoke{i}', sm, (0.09, 0.09, 0.07), (0, 0, 0), None, loc=(rnd.uniform(-0.25, 0.25), -0.6 + rnd.uniform(-0.2, 0.2), tz), lumpy=0.02)
            self.smoke.append((ob, i / 10, ob.location.x))
        bottle = clay('#2f8a4a', rough=0.15, sss=0.1, bump=0.03, prints=0)
        for i, x in enumerate((-1.1, 0.75, 1.3)):
            lathe(f'bbq.bottle{i}', bottle, [(tz, 0.05, 0.05), (tz + 0.16, 0.055, 0.055), (tz + 0.2, 0.025, 0.025), (tz + 0.28, 0.018, 0.018)], loc=(x, -0.5, 0))
            box(f'bbq.label{i}', clay('#f4f1e6', bump=0.05), (0.07, 0.01, 0.06), (0, 0, 0), loc=(x, -0.555, tz + 0.09), bevel=0.003)
        dishes = ['#c94a32', '#e6d8a8', '#5e8f3a', '#d27a2c', '#f0e6d6', '#a23a2a']
        for i, (x, y) in enumerate([(-1.4, -0.95), (-0.9, -1.0), (-0.55, -0.92), (0.55, -0.95), (0.95, -1.0), (1.45, -0.92)]):
            lathe(f'bbq.bowl{i}', clay('#f2efe8', rough=0.3, bump=0.05), [(tz, 0.05, 0.05), (tz + 0.04, 0.09, 0.09), (tz + 0.045, 0.085, 0.085)], loc=(x, y, 0))
            blob(f'bbq.food{i}', clay(dishes[i], bump=0.4), (0.07, 0.07, 0.025), (0, 0, 0), loc=(x, y, tz + 0.035), lumpy=0.006)
        steel = clay('#a6aaae', rough=0.3, bump=0.05)
        for x in (-1.2, 0.0, 1.2):
            for k in (-0.025, 0.025):
                snake(f'bbq.chop{x}{k}', steel, [(-0.12, 0, 0), (0.12, 0.03, 0)], 0.005, None, (x + 0.15, -1.06 + k, tz + 0.01))

    def animate(self, t):
        for p, o in self.lanterns:
            p.rotation_euler = (math.radians(math.sin(t * 1.5 + o) * 3), math.radians(math.sin(t * 1.1 + o) * 2), 0)
        for g, o in self.meat:
            g.scale = (1 - math.sin(t * 13 + o) * 0.03, 1, 1)
            g.location.z = self.tz + 0.1 + abs(math.sin(t * 20 + o)) * 0.004
        for ob, ph, x0 in self.smoke:
            k = (t * 0.45 + ph) % 1.0
            ob.location.z = self.tz + 0.12 + k * 0.7
            ob.location.x = x0 + math.sin(k * 5 + ph * 9) * 0.08
            ob.scale = (0.5 + k * 1.0,) * 3
            ob.hide_render = k > 0.7
