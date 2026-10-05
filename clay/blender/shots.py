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
        self.lu = Puppet('lu')
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
        aim(self.cam, (0.25, -3.0, 1.55), (0.05, 0, 1.45), 3.0)
        wv = lt * 11
        talk = self.ctx.talk(t, 0)
        up = seg(lt, 0.05, 0.4, back_out)
        lu.pose(x=lerp(1.4, 0.0, slide), y=0, rotz=lerp(-25, 8, slide), bob=abs(math.sin(wv / 2)) * 0.01, lean=(0, math.sin(wv) * 1.5),
                arms={'L': {'out': lerp(10, 145, up) + math.sin(wv) * 12, 'fwd': 10, 'bend': 25 + math.sin(wv + 1.2) * 22, 'wrist': 0},
                      'R': {'out': 8, 'fwd': 5, 'bend': 10}},
                head={'tilt': math.sin(wv) * 3, 'turn': -10, 'lookX': -0.3, 'raise': 0.8, 'mouth': 'grin',
                      'open': max(talk, 0.35), 'blink': blink(lt, 4)},
                jitter=1, seed=frame)
