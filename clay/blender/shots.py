# Clay staging for each scene of timeline.js. Each shot: build() makes the set, cast and camera;
# render(t) poses everything for second t of the scene. Mirrors src/scenes/*.js from the 2D version.
import bpy, math
from mathutils import Vector
from lib import Puppet, clay, blob, box, cone, snake, empty
from cast import Clay
import sets as S

def ease_out(x): return 1 - (1 - x) ** 3
def back_out(x, s=1.7): x -= 1; return 1 + x * x * ((s + 1) * x + s)
def seg(t, a, b, fn=None):
    x = min(1, max(0, (t - a) / (b - a))) if b > a else float(t >= a)
    return fn(x) if fn else x
def lerp(a, b, k): return a + (b - a) * k
def vlerp(a, b, k): return tuple(lerp(x, y, k) for x, y in zip(a, b))

def camera(lens=40, fstop=4.0):
    c = bpy.data.cameras.new('cam'); c.lens = lens; c.dof.use_dof = True; c.dof.aperture_fstop = fstop
    ob = bpy.data.objects.new('cam', c); bpy.context.scene.collection.objects.link(ob)
    bpy.context.scene.camera = ob
    return ob

def aim(cam, loc, target, focus=None):
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.dof.focus_distance = focus or d.length

def blink(t, seed=0, period=3.1):
    ph = (t + seed * 1.37) % period
    return 1.0 if ph < 0.12 else 0.0

def walk(t, speed=2.0, power=1.0):
    w = t * speed * math.pi
    return dict(
        bob=abs(math.sin(w)) * 0.025 * power,
        legs={'L': {'fwd': math.sin(w) * 28 * power}, 'R': {'fwd': -math.sin(w) * 28 * power}},
        arms={'L': {'fwd': -math.sin(w) * 22 * power, 'out': 8, 'bend': 15}, 'R': {'fwd': math.sin(w) * 22 * power, 'out': 8, 'bend': 15}},
    )

class Ctx:
    """Shared per-scene helpers: talking (voice envelope or fallback flaps) and screen anchors."""
    def __init__(self, cfg, voices, fps):
        self.cfg = cfg; self.voices = voices or {}; self.fps = fps
    def talk(self, t, idx):
        d = self.cfg['dialogue'][idx]
        v = self.voices.get(str(idx))
        if v:
            k = (t - d['at'] - v.get('offset', 0)) * v['rate']
            i = int(k)
            if 0 <= i < len(v['env']):
                return min(1.0, v['env'][i] * 1.3)
            return 0.0
        # fallback: flap while the text would be typing
        dur = len(d['text']) * 0.055
        lt = t - d['at']
        return 0.5 + 0.5 * math.sin(lt * 22) if 0 <= lt < dur else 0.0


def clipboard(parent, loc, rot):
    g = empty('clipboard', parent, loc); g.rotation_euler = rot
    box('board', clay('#a8743f', bump=0.5), (0.24, 0.018, 0.32), (0, 0, 0), g, bevel=0.012)
    box('paper', clay('#f7f3e8', bump=0.15), (0.2, 0.01, 0.26), (0, -0.012, -0.015), g, bevel=0.004)
    box('clip', clay('#b8bcc0', rough=0.3, bump=0.1), (0.09, 0.03, 0.035), (0, -0.016, 0.15), g, bevel=0.01)
    ink = clay('#3a4a5c', bump=0.05)
    tick = clay('#2f8f4a', bump=0.1)
    checks = []
    for i in range(4):
        z = 0.08 - i * 0.06
        snake(f'line{i}', ink, [(-0.03, 0, z), (0.085, 0, z + 0.001)], 0.0035, g, (0, -0.019, 0))
        box(f'boxk{i}', clay('#d9d2c2', bump=0.05), (0.03, 0.004, 0.03), (0, 0, 0), g, loc=(-0.065, -0.019, z), bevel=0.003)
        c = snake(f'check{i}', tick, [(-0.014, 0, 0.002), (-0.003, 0, -0.012), (0.02, 0, 0.018)], 0.006, g, (-0.065, -0.026, z))
        checks.append(c)
    return g, checks


SHOTS = {}
def shot(name):
    def deco(cls): SHOTS[name] = cls; return cls
    return deco


@shot('checklist')
class Checklist:
    """Scene 1: Noah ticks his work order in the empty lot... then hears something. (clay cast v2)"""
    def build(self, ctx):
        S.parking_lot()
        S.lights()
        self.noah = Clay('noah')
        self.board, self.checks = clipboard(self.noah.torso, (0.02, -0.21, 0.2), (math.radians(-38), 0, math.radians(-4)))
        self.board.scale = (0.85, 0.85, 0.85)
        self.pen = cone('pen', clay('#2f5fa8', rough=0.3, bump=0.05), 0.009, 0.003, 0.12, (0, 0, -0.06), self.noah.hand['R'], (0, -0.025, 0))
        self.pen.rotation_euler = (math.radians(-60), 0, 0)
        self.cam = camera(42, 3.2)
        self.ctx = ctx
        self.ticks = [s['at'] for s in ctx.cfg['sfx'] if s.get('sound') == 'tick']
        self.huh = next((s['at'] for s in ctx.cfg['sfx'] if s.get('sound') == 'huh'), 4.25)
        return {'noah': self.noah.mouthP}

    def render(self, t, frame):
        n = self.noah
        snap = seg(t, self.huh, self.huh + 0.35, back_out)
        startled = t >= self.huh
        # camera: slow push in on the medium shot, then a snap zoom onto his face
        a = (0.5 - t * 0.02, -2.5 + t * 0.06, 1.0)
        b = (0.12, -1.15, 1.16)
        aim(self.cam, vlerp(a, b, snap), vlerp((0.05, 0, 0.84), (0.02, 0, 1.12), snap))
        rows = [1.0] + [seg(t, x - 0.25, x, ease_out) for x in self.ticks] + [0.0]
        for c, k in zip(self.checks, rows):
            c.hide_render = k <= 0.01
            c.scale = (max(k, 0.01),) * 3
        row = next((i for i, x in enumerate(self.ticks) if t < x + 0.25), len(self.ticks))
        writing = not startled and row < len(self.ticks) and t > self.ticks[row] - 0.35
        scrib = math.sin(t * 40) * 4 if writing else 0
        line = 1 if startled else 0
        talk = self.ctx.talk(t, line)
        hop = math.sin(seg(t, self.huh, self.huh + 0.3) * math.pi) * 0.05
        self.board.location = (0.02, -0.21, 0.2 - 0.1 * snap)
        self.board.rotation_euler = (math.radians(-38 + 25 * snap), 0, math.radians(-4))
        n.pose(
            bob=hop, lean=(0, 0) if startled else (-5, 0), jitter=1, seed=frame,
            arms={'L': {'fwd': 40 - 15 * snap, 'out': -16, 'bend': 60 - 15 * snap, 'twist': 10},
                  'R': ({'fwd': lerp(50, 25, snap), 'out': lerp(-20, 20, snap), 'bend': lerp(70, 35, snap)} if startled else
                        {'fwd': 52 + scrib * 0.6, 'out': -22 + scrib, 'bend': 68 - row * 4})},
            head=({'tilt': -4, 'turn': 14 * snap, 'nod': -4, 'lookX': 0.8, 'lookY': -0.1, 'eyes': 'wide', 'raise': 1.4,
                   'mouth': 'o', 'open': max(talk, 0.45)} if startled else
                  {'tilt': 5, 'nod': 18, 'turn': 4, 'lookX': 0.1, 'lookY': 0.9, 'eyes': 'tired', 'raise': -0.3, 'blink': blink(t, 2) * 0.6,
                   'mouth': 'talk' if talk > 0.05 else 'smile', 'open': talk * 0.7}),
            cape=0.05 + (0.3 * hop / 0.05 if startled else 0),
        )


@shot('hey-noah')
class HeyNoah:
    def build(self, ctx):
        S.parking_lot(seed=5)
        S.lights(sun_rot=(50, 4, 40))
        self.ctx = ctx
        self.lu = Clay('lu')
        self.cam = camera(35, 5.6)
        self.cut = next((s['at'] for s in ctx.cfg['sfx'] if s.get('sound') == 'whoosh'), 1.95)
        return {'lu': self.lu.mouthP}

    def render(self, t, frame):
        lu = self.lu
        if t < self.cut:
            # wide: Lu strolls across the lot toward us
            aim(self.cam, (0.6, -7.5, 1.7), (-0.2, 4, 1.2), 11.5)
            self.cam.data.lens = 35 + t * 1.5
            w = walk(t, 1.9, 0.9)
            lu.pose(x=-2.4 + t * 0.9, y=6.5 - t * 1.2, rotz=-28, bob=w['bob'], legs=w['legs'], arms=w['arms'],
                    head={'turn': 12, 'mouth': 'smile', 'blink': blink(t, 1)}, jitter=1, seed=frame)
            return
        lt = t - self.cut
        slide = seg(lt, 0, 0.4, back_out)
        self.cam.data.lens = 50
        aim(self.cam, (0.25, -3.2, 1.72), (0.05, 0, 1.6), 3.2)
        wv = lt * 11
        talk = self.ctx.talk(t, 0)
        up = seg(lt, 0.05, 0.4, back_out)
        lu.pose(x=lerp(1.4, 0.0, slide), y=0, rotz=lerp(-25, 8, slide), bob=abs(math.sin(wv / 2)) * 0.01, lean=(0, math.sin(wv) * 1.5),
                arms={'L': {'out': lerp(10, 145, up) + math.sin(wv) * 12, 'fwd': 10, 'bend': 25 + math.sin(wv + 1.2) * 22, 'wrist': 0},
                      'R': {'out': 8, 'fwd': 5, 'bend': 10}},
                head={'tilt': math.sin(wv) * 3, 'turn': -10, 'lookX': -0.3, 'raise': 0.8, 'mouth': 'grin',
                      'open': max(talk, 0.35), 'blink': blink(lt, 4)},
                jitter=1, seed=frame)


# ====================================================================== scenes 3-11 (clay cast v2)
import props as P
from lib import torus

def run_cycle(t, speed=3.4, power=1.4, arms=True):
    w = t * speed * math.pi
    d = dict(bob=abs(math.sin(w)) * 0.05 * power,
             legs={'L': {'fwd': math.sin(w) * 34 * power}, 'R': {'fwd': -math.sin(w) * 34 * power}})
    if arms:
        d['arms'] = {'L': {'fwd': -math.sin(w) * 40 * power, 'out': 12, 'bend': 70}, 'R': {'fwd': math.sin(w) * 40 * power, 'out': 12, 'bend': 70}}
    return d

def cues(ctx, sound, default):
    return [s['at'] for s in ctx.cfg['sfx'] if s.get('sound') == sound] or [default]


@shot('run')
class Run:
    """Scene 3: close-up scream, then Noah bolts at the camera; the clipboard goes PLINK PLINK PLINK; Lu jogs after him."""
    def build(self, ctx):
        S.parking_lot(); S.lights()
        self.ctx = ctx
        self.noah = Clay('noah'); self.lu = Clay('lu')
        self.board, checks = clipboard(None, (0, 0, 0), (0, 0, 0))
        for c in checks[:2]: c.hide_render = False
        for c in checks[2:]: c.hide_render = True
        self.cam = camera(40, 4.0)
        self.plinks = cues(ctx, 'plink', 2.05)
        self.zoom = cues(ctx, 'whoosh', 3.9)[0]
        return {'noah': self.noah.mouthP}

    def ny(self, t):  # Noah's distance along the lot: far -> right by the camera
        return lerp(5.0, -6.2, seg(t, 0.9, self.zoom + 0.3)) - max(0, t - self.zoom - 0.3) * 3.0

    def render(self, t, frame):
        n = self.noah; talk = self.ctx.talk(t, 0)
        if t < 0.9:  # shot A: the scream, tight
            sh = math.sin(t * 70) * 0.012 * (1 - seg(t, 0, 0.3))
            aim(self.cam, (0.12 + sh, -1.15, 1.16), (0.02, 0, 1.12 + sh))
            self.cam.data.lens = 42
            sc = seg(t, 0.25, 0.75, ease_out)
            n.pose(lean=(-4, 0), arms={'L': {'fwd': 30, 'out': 20, 'bend': 60}, 'R': {'fwd': 30, 'out': 20, 'bend': 60}},
                   head={'tilt': -4 + math.sin(t * 60) * 1.5, 'turn': 10, 'lookX': 0.6, 'eyes': 'wide', 'raise': 1.5, 'browTilt': -8,
                         'mouth': 'yell', 'open': 0.5 + sc * 0.6}, cape=0.1, jitter=1, seed=frame)
            self.lu.root.location = (0, 60, 0); self.board.location = (0, 60, 0)
            return
        y = self.ny(t)
        cy = -8.6 - max(0, t - self.zoom - 0.3) * 3.0
        shake = math.sin(t * 23) * 0.02
        self.cam.data.lens = 34
        aim(self.cam, (0.4 + shake, cy, 1.0), (0.1, y + 3, 0.85 + shake * 0.5), abs(y - cy))
        rc = run_cycle(t, 3.4, 1.4, arms=False)
        flail = math.sin(t * 6.8 * math.pi / 2)
        n.pose(x=0, y=y, bob=rc['bob'], lean=(10, 0), legs=rc['legs'],
               arms={'L': {'fwd': 70 + flail * 40, 'out': 60, 'bend': 30}, 'R': {'fwd': 70 - flail * 40, 'out': 60, 'bend': 30}},
               head={'tilt': math.sin(t * 21) * 3, 'eyes': 'wide', 'raise': 1.3, 'browTilt': -8, 'mouth': 'yell', 'open': 0.7 + talk * 0.3},
               cape=0.6 + 0.2 * math.sin(t * 20), jitter=1, seed=frame)
        # Lu jogs after him in the distance
        on = t > 1.3
        lr = run_cycle(t + 0.2, 2.8, 0.8)
        self.lu.pose(x=1.1, y=(12 - (t - 1.3) * 1.6) if on else 60, bob=lr['bob'], lean=(6, 0), legs=lr['legs'], arms=lr['arms'],
                     head={'mouth': 'grin', 'open': 0.5, 'raise': 0.8}, jitter=1, seed=frame)
        # clipboard: flies from his hands at ~1.5 s, then bounces at each PLINK
        drop = self.plinks[0] - 0.5
        if t < drop:
            bpy.context.view_layer.update(); hp = n.hand["R"].matrix_world.translation
            self.board.location = hp + Vector((0.08, -0.12, 0)); self.board.rotation_euler = (math.radians(-60), 0, 0)
        else:
            y0 = self.ny(drop)
            pts = [drop] + self.plinks
            k = next((i for i in range(len(pts) - 1) if t < pts[i + 1]), None)
            if k is None:
                h = 0; tt = 1
                x = 0.9
            else:
                tt = seg(t, pts[k], pts[k + 1]); h = math.sin(tt * math.pi) * (0.9 if k == 0 else 0.45 / k)
                x = 0.3 * (k + tt)
            self.board.location = (0.15 + x, y0 + 0.4, 0.06 + h + (0.9 if k == 0 and tt < 0.5 else 0) * (1 - tt * 2) * 0)
            self.board.rotation_euler = (math.radians(-90 + (k or 3) * 25 + tt * 40), math.radians(t * 200 if k is not None else 15), 0)


@shot('phone')
class Phone:
    """Scene 4: still running, Noah calls the Boss. Camera trucks backward in front of him; Lu small far behind."""
    def build(self, ctx):
        S.parking_lot(); S.lights()
        self.ctx = ctx
        self.noah = Clay('noah'); self.lu = Clay('lu')
        P.ear_phone(self.noah)
        self.cam = camera(40, 2.8)
        return {'noah': self.noah.mouthP}

    def render(self, t, frame):
        n = self.noah; talk = self.ctx.talk(t, 0)
        y = 6 - t * 3.0
        sh = math.sin(t * 9) * 0.015
        aim(self.cam, (0.45 + sh, y - 2.1, 1.0 + abs(math.sin(t * 10.7)) * 0.02), (0.08, y, 0.98), 2.15)
        rc = run_cycle(t, 3.4, 1.2)
        n.pose(x=0, y=y, bob=rc['bob'], lean=(8, 0), legs=rc['legs'],
               arms={'L': rc['arms']['L'], 'R': {'fwd': 80, 'out': 30, 'bend': 150}},
               head={'tilt': -6 + math.sin(t * 10) * 2, 'turn': -8, 'lookX': 0.5, 'eyes': 'wide', 'raise': 0.8, 'browTilt': -6,
                     'mouth': 'talk' if talk > 0.05 else 'o', 'open': max(talk, 0.35)}, cape=0.55 + 0.15 * math.sin(t * 20), jitter=1, seed=frame)
        lr = run_cycle(t, 2.8, 0.8)
        self.lu.pose(x=1.6, y=y + 13, bob=lr['bob'], lean=(6, 0), legs=lr['legs'], arms=lr['arms'], head={'mouth': 'grin', 'open': 0.5}, jitter=1, seed=frame)


@shot('hot-tub')
class HotTubShot:
    """Scene 5: the Boss soaking in the backyard hot tub. BLUB BLUB. RING RING. He answers: I'll take care of it!"""
    def build(self, ctx):
        P.backyard(); S.lights(sun_rot=(68, 0, 30), sun=2.4)
        self.ctx = ctx
        self.tub = P.HotTub()
        self.boss = P.sit('boss', self.tub.root, (0, 0.45, self.tub.wz - 0.08), shirtless=True)
        self.rimPhone = P.phone(self.tub.root, (0.95, -0.55, self.tub.H + 0.07), (math.radians(90), 0, math.radians(30)))
        self.handPhone = P.ear_phone(self.boss)
        self.cam = camera(38, 5.6)
        self.ring = cues(ctx, 'phonering', 2.6)[0]
        return {'boss': self.boss.mouthP}

    def render(self, t, frame):
        b = self.boss; talk = self.ctx.talk(t, 0)
        self.tub.animate(t)
        push = seg(t, 0, 6.8, lambda x: x * x * (3 - 2 * x))
        aim(self.cam, (lerp(0.3, 0.1, push), lerp(-4.6, -3.4, push), lerp(2.0, 1.8, push)), (0, 0.35, 1.5))
        pick = seg(t, self.ring + 0.5, self.ring + 0.9, ease_out)
        ringing = self.ring <= t < self.ring + 0.6
        self.rimPhone.hide_render = pick > 0.3
        self.handPhone.hide_render = pick <= 0.3
        self.rimPhone.rotation_euler = (math.radians(90), 0, math.radians(30 + (math.sin(t * 90) * 8 if ringing else 0)))
        relax = 1 - pick
        b.pose(legs={'L': {'fwd': 40}, 'R': {'fwd': 40}}, lean=(-6 * relax, 0), bob=math.sin(t * 1.3) * 0.01,
               arms={'L': {'fwd': 10, 'out': 75, 'bend': 10},
                     'R': {'fwd': lerp(10, 80, pick), 'out': lerp(75, 30, pick), 'bend': lerp(10, 150, pick)}},
               head={'tilt': lerp(-6, 4, pick) + math.sin(t * 0.8) * 2, 'nod': lerp(-12, 0, pick), 'turn': lerp(0, -15, seg(t, self.ring, self.ring + 0.3)),
                     'raise': 0.6 if talk > 0.05 else 0.2, 'mouth': 'talk' if talk > 0.05 else ('grin' if t > self.ring + 0.9 else 'smile'),
                     'open': talk if talk > 0.05 else (0.4 if t > self.ring + 0.9 else 0)}, jitter=1, seed=frame)


@shot('chase')
class Chase:
    """Scene 6: Noah running, furious; Lu closes in behind him: I just... wanna... help!"""
    def build(self, ctx):
        S.parking_lot(); S.lights()
        self.ctx = ctx
        self.noah = Clay('noah'); self.lu = Clay('lu')
        self.cam = camera(34, 4.0)
        return {'lu': self.lu.mouthP}

    def render(self, t, frame):
        talk = self.ctx.talk(t, 0)
        y = 8 - t * 3.0
        aim(self.cam, (0.1 + math.sin(t * 8) * 0.02, y - 3.4, 1.3), (0.05, y + 0.6, 1.05), 3.6)
        rc = run_cycle(t, 3.4, 1.3)
        self.noah.pose(x=-0.45, y=y, bob=rc['bob'], lean=(10, 0), legs=rc['legs'], arms=rc['arms'],
                       head={'tilt': 4, 'turn': 12, 'lookX': 0.9, 'eyes': 'angry', 'browTilt': 16, 'mouth': 'frown', 'open': 0.0},
                       cape=0.6 + 0.15 * math.sin(t * 20), jitter=1, seed=frame)
        gain = seg(t, 0, 2.6, ease_out)
        lr = run_cycle(t + 0.13, lerp(4.2, 3.4, gain), 1.2)
        reach = seg(gain, 0.6, 1.0)
        self.lu.pose(x=0.55, y=y + lerp(4.0, 0.9, gain), bob=lr['bob'], lean=(lerp(12, 4, gain), 0), legs=lr['legs'],
                     arms={'L': lr['arms']['L'], 'R': ({'fwd': lerp(30, 80, reach) + math.sin(t * 6) * 4, 'out': 20, 'bend': 10} if reach > 0 else lr['arms']['R'])},
                     head={'tilt': -6, 'turn': -18, 'lookX': -0.8, 'raise': 1.2, 'browTilt': -10, 'eyes': 'wide' if talk > 0.05 else None,
                           'mouth': 'talk' if talk > 0.05 else 'grin', 'open': max(talk, 0.3)}, jitter=1, seed=frame)


@shot('screech')
class Screech:
    """Scene 7: wide. The brown car tears in from the right and skids to a stop. SCREEEECH."""
    def build(self, ctx):
        S.parking_lot(); S.lights()
        self.ctx = ctx
        self.noah = Clay('noah'); self.lu = Clay('lu')
        self.car = P.Car()
        self.boss = P.sit('boss', self.car.seat(-0.15, -0.48), rotz=0)
        self.cam = camera(32, 8.0)
        self.sc = cues(ctx, 'screech', 1.3)[0]
        mk = clay('#2b2b2d', bump=0.1)
        self.skids = [box(f'skid{i}', mk, (1, 0.16, 0.012), (0.5, 0, 0.012), None, bevel=0) for i in range(2)]
        sm = P.puff('#d9d6d0', 0.6)
        self.smoke = [blob(f'smoke{i}', sm, (0.3, 0.3, 0.25), (0, 0, 0), None, lumpy=0.05) for i in range(8)]
        return {}

    def render(self, t, frame):
        sc = self.sc; enter, stop = sc - 0.35, sc + 1.5
        p = seg(t, enter, stop, ease_out)
        x = lerp(16, 2.6, p)
        brake = seg(t, sc, stop)
        bounce = math.sin((t - stop) * 14) * 3 * math.exp(-(t - stop) * 4) if t > stop else 0
        shake = math.sin(t * 80) * 0.03 * brake if t < stop else 0
        aim(self.cam, (0.3 + shake, -10.5, 1.3), (0.3, 0, 0.9), 10.5)
        self.car.pose(x=x, y=-0.3, pitch=(-3.0 * brake if t < stop else -bounce), spin=-x / 0.37)
        self.boss.pose(legs={'L': {'fwd': 85}, 'R': {'fwd': 85}}, arms={'L': {'fwd': 60, 'bend': 30}, 'R': {'fwd': 60, 'bend': 30}},
                       head={'turn': 50 * seg(t, stop, stop + 0.4), 'mouth': 'grin', 'open': 0.4})
        xs = lerp(16, 2.6, seg(sc, enter, stop, ease_out))
        for i, sk in enumerate(self.skids):
            wx = x + 1.35
            sk.hide_render = t < sc
            sk.location = (wx, -0.3 + (-0.82 if i == 0 else 0.82), 0)
            sk.scale = (max(0.01, xs - x), 1, 1)
        fade = (min(1, brake * 1.5) if t < stop + 0.4 else max(0, 1 - (t - stop - 0.4) * 2)) if t > sc else 0
        for i, ob in enumerate(self.smoke):
            k = ((t * 1.3 + i / 8) % 1.0)
            ob.location = (x + 1.6 + k * 1.2, -0.9 + (i % 3) * 0.6, 0.2 + k * 0.7)
            ob.scale = (fade * (0.6 + k),) * 3
            ob.hide_render = fade < 0.05
        halt = seg(t, sc - 0.1, sc + 0.7, ease_out)
        look = seg(t, sc, sc + 0.4)
        for who, ob, xx, ph in (('noah', self.noah, -3.6, 0), ('lu', self.lu, -2.1, 0.2)):
            rc = run_cycle(t + ph, 3.4 if who == 'noah' else 3.1, (1 - halt) * (1.2 if who == 'noah' else 0.9))
            ob.pose(x=xx + (1 - halt) * -0.6 + t * 0.15 * (1 - halt), y=lerp(1.5, 0.6, halt), rotz=lerp(-35, 0, halt), bob=rc['bob'], lean=(8 * (1 - halt) - 6 * halt, 0),
                    legs=rc['legs'], arms=rc['arms'],
                    head={'turn': 55 * look, 'lookX': look, 'eyes': 'wide', 'raise': 1.2, 'mouth': 'o', 'open': 0.6},
                    cape=0.3 * (1 - halt) + 0.05, jitter=1, seed=frame)


@shot('jump-in')
class JumpIn:
    """Scene 8: at the driver's window. HONNNK! The Boss leans out: Hey guys! Jump in!"""
    def build(self, ctx):
        S.parking_lot(); S.lights(sun_rot=(50, 4, -30))
        self.ctx = ctx
        self.car = P.Car()
        self.boss = P.sit('boss', self.car.seat(-0.1, -0.42), rotz=0)
        self.cam = camera(40, 3.5)
        return {'boss': self.boss.mouthP}

    def render(self, t, frame):
        talk = self.ctx.talk(t, 0)
        push = seg(t, 0, 3.4, lambda x: x * x * (3 - 2 * x))
        aim(self.cam, (lerp(-0.9, -0.55, push), lerp(-3.7, -3.2, push), 1.5), (lerp(-0.4, -0.3, push), -0.4, 1.5))
        self.car.pose(rock=math.sin(t * 30) * 0.15)
        lean = seg(t, 0.05, 0.4, back_out)
        wave = math.sin(t * 7)
        self.boss.pose(legs={'L': {'fwd': 85}, 'R': {'fwd': 85}}, lean=(0, lerp(0, -10, lean)),
                       arms={'L': {'fwd': lerp(40, 20, lean), 'out': lerp(10, 95, lean) + wave * 8, 'bend': lerp(30, 60, lean) + wave * 20},
                             'R': {'fwd': 60, 'out': -10, 'bend': 40}},
                       head={'tilt': -4, 'turn': lerp(20, 60, lean), 'lookX': 0.4, 'raise': 0.8,
                             'mouth': 'talk' if talk > 0.05 else 'grin', 'open': talk if talk > 0.05 else 0.55},
                       jitter=1, seed=frame)


class InCar:
    """Scenes 9-10: head-on through the windshield while they drive; Lu (left), Noah (middle), the Boss driving (right)."""
    def build(self, ctx):
        S.parking_lot(); S.lights(sun_rot=(55, 0, 160))
        self.ctx = ctx
        self.car = P.Car()
        self.lu = P.sit('lu', self.car.seat(-0.12, 0.5))
        self.noah = P.sit('noah', self.car.seat(-0.12, 0.0, 0.98))
        self.boss = P.sit('boss', self.car.seat(-0.12, -0.5))
        self.cam = camera(40, 5.0)
        return {'lu': self.lu.mouthP, 'noah': self.noah.mouthP, 'boss': self.boss.mouthP}

    def place(self, t, dist, frame, look_y=1.45, lens=40, x=0.0):
        y = 5 - t * 2.5
        self.car.pose(x=0, y=y, rotz=90, rock=math.sin(t * 17) * 0.4, spin=t * 2.5 / 0.37)
        self.cam.data.lens = lens
        aim(self.cam, (x, y - dist, 1.55), (x, y, look_y), dist)

    def sitting(self, ob, arms, head, frame, lean=(0, 0)):
        ob.pose(legs={'L': {'fwd': 85}, 'R': {'fwd': 85}}, arms=arms, head=head, lean=lean, jitter=1, seed=frame,
                **({'cape': 0.0} if ob.who == 'noah' else {}))


@shot('lunchtime')
class Lunchtime(InCar):
    def render(self, t, frame):
        lunch, chip = self.ctx.cfg['dialogue']
        self.place(t, lerp(6.2, 5.6, seg(t, 0, 3.8)), frame)
        cheer = seg(t, lunch['at'] - 0.1, lunch['at'] + 0.25, back_out) * (1 - seg(t, lunch['at'] + 1.6, lunch['at'] + 2.0))
        pump = math.sin(t * 12) * 10 * cheer
        tl = self.ctx.talk(t, 0); tc = self.ctx.talk(t, 1)
        self.sitting(self.lu, {'L': {'fwd': 20, 'out': lerp(10, 150, cheer) + pump, 'bend': 30}, 'R': {'fwd': 40, 'bend': 50}},
                     {'tilt': 3, 'turn': -6, 'mouth': 'talk' if tl > 0.05 else 'grin', 'open': max(tl, 0.35), 'eyes': 'happy' if cheer > 0.5 else None,
                      'blink': blink(t, 3)}, frame)
        self.sitting(self.noah, {'L': {'fwd': 20, 'out': lerp(10, 160, cheer) - pump, 'bend': 20}, 'R': {'fwd': 20, 'out': lerp(10, 160, cheer) + pump, 'bend': 20}},
                     {'tilt': math.sin(t * 8) * 4, 'mouth': 'talk' if (tl + tc) > 0.05 else 'grin', 'open': max(tl, tc, 0.5), 'eyes': 'happy', 'raise': 0.8}, frame)
        tb = max(tl, tc)
        self.sitting(self.boss, {'L': {'fwd': 70, 'out': 5, 'bend': 40}, 'R': {'fwd': 70, 'out': 5, 'bend': 40}},
                     {'tilt': -5 if t > chip['at'] else 2, 'turn': 8, 'mouth': 'talk' if tb > 0.05 else 'grin', 'open': max(tb, 0.45),
                      'raise': 1.0 if t > chip['at'] else 0.3}, frame)
SHOTS['lunchtime'] = Lunchtime


@shot('no')
class No(InCar):
    def render(self, t, frame):
        self.place(t, 3.4, frame, look_y=1.5, lens=45, x=lerp(-0.35, -0.3, t / 2.6))
        talk = self.ctx.talk(t, 0)
        self.sitting(self.lu, {'L': {'fwd': 40, 'bend': 50}, 'R': {'fwd': 40, 'bend': 50}},
                     {'tilt': -3, 'turn': -4, 'blink': 1, 'browTilt': 18, 'raise': -0.4, 'mouth': 'yell' if talk > 0.05 else 'frown', 'open': talk}, frame,
                     lean=(-4, 0))
        self.sitting(self.noah, {'L': {'fwd': 30, 'bend': 40}, 'R': {'fwd': 30, 'bend': 40}},
                     {'turn': 25 * seg(t, 0.3, 0.6), 'lookX': 1, 'eyes': 'wide', 'raise': 1.2, 'mouth': 'o', 'open': 0.5}, frame)
        self.sitting(self.boss, {'L': {'fwd': 70, 'out': 5, 'bend': 40}, 'R': {'fwd': 70, 'out': 5, 'bend': 40}},
                     {'tilt': 3, 'turn': 25, 'lookX': 0.8, 'mouth': 'o', 'open': 0.5, 'raise': 1.3}, frame)


@shot('bbq')
class Bbq:
    """Scene 11: Korean BBQ after all. Sizzle, smiles, then the end card (drawn by the overlay)."""
    def build(self, ctx):
        self.room = P.BBQ()
        self.ctx = ctx
        self.boss = P.sit('boss', None, (-1.2, -0.05, 0.5))
        self.noah = P.sit('noah', None, (0.0, 0.3, 0.8))
        self.lu = P.sit('lu', None, (1.2, -0.05, 0.5))
        self.soju = cone('soju', clay('#2f8a4a', rough=0.15, bump=0.03, prints=0), 0.045, 0.02, 0.26, (0, 0, -0.13), self.boss.hand['R'], (0, -0.04, 0))
        self.soju.rotation_euler = (math.radians(180), 0, 0)
        steel = clay('#a6aaae', rough=0.3, bump=0.05)
        for who in (self.noah, self.lu):
            for k in (-0.008, 0.008):
                snake(f'{who.who}.chop{k}', steel, [(0, 0, 0), (0, -0.02, -0.2)], 0.004, who.hand['R' if who is self.noah else 'L'], (k, -0.02, 0))
        self.cam = camera(40, 4.0)
        return {}

    def render(self, t, frame):
        self.room.animate(t)
        out = seg(t, 0.2, 2.2, ease_out)
        aim(self.cam, (0, lerp(-2.6, -5.0, out), lerp(1.35, 1.6, out)), (0, 0, lerp(1.25, 1.15, out)))
        chew = abs(math.sin(t * 7))
        sit = {'L': {'fwd': 85}, 'R': {'fwd': 85}}
        self.boss.pose(legs=sit, lean=(0, 3), arms={'L': {'fwd': 55, 'out': 5, 'bend': 60}, 'R': {'fwd': 20, 'out': 150 + math.sin(t * 4) * 6, 'bend': 20}},
                       head={'tilt': -4, 'turn': 10, 'mouth': 'grin', 'open': 0.55 + chew * 0.1, 'raise': 0.4}, jitter=1, seed=frame)
        self.noah.pose(legs={'L': {'fwd': 10}, 'R': {'fwd': 10}}, bob=abs(math.sin(t * 5)) * 0.02,
                       arms={'L': {'fwd': 60, 'out': 10, 'bend': 50}, 'R': {'fwd': 40, 'out': 110 + math.sin(t * 5) * 12, 'bend': 40}},
                       head={'tilt': math.sin(t * 5) * 4, 'mouth': 'grin', 'open': 0.7, 'eyes': 'happy', 'raise': 0.8}, cape=0.05, jitter=1, seed=frame)
        self.lu.pose(legs=sit, lean=(0, -3), arms={'L': {'fwd': 60 + math.sin(t * 3 + 1) * 8, 'out': 20, 'bend': 60}, 'R': {'fwd': 55, 'out': 5, 'bend': 60}},
                     head={'tilt': 4, 'turn': -10, 'mouth': 'grin', 'open': 0.4, 'eyes': 'happy' if t % 2.6 > 1.6 else None, 'raise': 0.4,
                           'blink': blink(t, 5)}, jitter=1, seed=frame)
