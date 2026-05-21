import pygame
import asyncio
import math
import random
from levels import LEVELS

TILE_SIZE = 32
SCREEN_W = 900
SCREEN_H = 560
FPS = 60

GRAVITY = 0.45
JUMP_FORCE = -10.5
ACCELERATION = 0.55
FRICTION_GROUND = 0.80
FRICTION_AIR = 0.94
MAX_FALL = 16
COYOTE_FRAMES = 7
JUMP_BUFFER = 8
PLAYER_W = 26
PLAYER_H = 28

COL_BG           = (13,   17,  23)
COL_PLATFORM     = (106, 106, 136)
COL_PLATFORM_TOP = (136, 136, 170)
COL_PLAT_SHADOW  = (60,   60,  80)
COL_HAZARD       = (255,  48,  48)
COL_HAZARD_DARK  = (170,  16,  16)
COL_HAZARD_INNER = (255,  96,  48)
COL_CHECKPOINT   = (255, 215,  64)
COL_CKPT_ACTIVE  = (64,  255, 170)
COL_GOAL         = (64,  255, 112)
COL_PLAYER       = (50,  200, 150)
COL_PLAYER_DARK  = (26,  128,  96)
COL_PLAYER_HL    = (96,  255, 204)
COL_TEXT         = (224, 224, 255)
COL_TEXT_DIM     = (128, 128, 170)
COL_BLACK        = (0,     0,   0)
COL_WHITE        = (255, 255, 255)


def parse_level(level_str):
    grid = []
    start_col, start_row = 2, 2
    for r, line in enumerate(level_str.split("\n")):
        if line.strip().startswith("#"):
            continue
        row = []
        for c, ch in enumerate(line):
            if ch == "S":
                start_col, start_row = c, r
                row.append(" ")
            elif ch == "k":
                row.append("K")
            else:
                row.append(ch)
        grid.append(row)
    rows = len(grid)
    cols = max((len(row) for row in grid), default=0)
    for row in grid:
        while len(row) < cols:
            row.append(" ")
    return {
        "grid": grid,
        "rows": rows,
        "cols": cols,
        "start_col": start_col,
        "start_row": start_row,
        "width": cols * TILE_SIZE,
        "height": rows * TILE_SIZE,
    }


def get_tile(level, col, row):
    if row < 0 or row >= level["rows"] or col < 0 or col >= level["cols"]:
        return " "
    row_data = level["grid"][row]
    return row_data[col] if col < len(row_data) else " "


def is_solid(t):
    return t in ("P", "L")


def is_hazard(t):
    return t in ("K", "k")


class Player:
    def __init__(self, level):
        self.x = level["start_col"] * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2
        self.y = level["start_row"] * TILE_SIZE - PLAYER_H
        self.vx = 0.0
        self.vy = 0.0
        self.w = PLAYER_W
        self.h = PLAYER_H
        self.on_ground = False
        self.coyote = 0
        self.jump_buffer = 0
        self.facing = 1
        self.squish = 1.0
        self.stretch = 1.0


class GameState:
    def __init__(self, level_idx=0, deaths=0, total_time=0):
        self.level_idx = level_idx
        self.level = parse_level(LEVELS[level_idx])
        self.player = Player(self.level)
        self.cam_x = float(self.player.x - SCREEN_W // 2)
        self.cam_y = float(self.player.y - SCREEN_H // 2)
        self.ckpt_x = self.player.x
        self.ckpt_y = self.player.y
        self.visited_ckpts = set()
        self.deaths = deaths
        self.time = total_time
        self.death_flash = 0.0
        self.goal_flash = 0.0
        self.won = False
        self.show_controls = False
        self.particles = []


def resolve_axis(player, level, axis):
    landed = False
    p = player
    left  = int(p.x / TILE_SIZE)
    right = int((p.x + p.w - 0.01) / TILE_SIZE)
    top   = int(p.y / TILE_SIZE)
    bot   = int((p.y + p.h - 0.01) / TILE_SIZE)

    for r in range(top, bot + 1):
        for c in range(left, right + 1):
            t = get_tile(level, c, r)
            if not is_solid(t):
                continue
            tl = c * TILE_SIZE
            tr = tl + TILE_SIZE
            tt = r * TILE_SIZE
            tb = tt + TILE_SIZE
            ol = p.x + p.w - tl
            or_ = tr - p.x
            ot = p.y + p.h - tt
            ob = tb - p.y
            if ol <= 0 or or_ <= 0 or ot <= 0 or ob <= 0:
                continue
            if axis == "x":
                if ol < or_:
                    p.x = tl - p.w
                else:
                    p.x = tr
                p.vx = 0
            else:
                if ot < ob:
                    p.y = tt - p.h
                    p.vy = 0
                    p.on_ground = True
                    landed = True
                else:
                    p.y = tb
                    p.vy = abs(p.vy) * 0.1
    return landed


def spawn_particles(state, x, y, color, count, speed):
    for i in range(count):
        angle = math.pi * 2 * i / count + random.uniform(0, 0.5)
        s = speed * (0.5 + random.random() * 0.5)
        state.particles.append({
            "x": x, "y": y,
            "vx": math.cos(angle) * s,
            "vy": math.sin(angle) * s,
            "life": 1.0,
            "color": color,
            "size": 3.0 + random.random() * 4.0,
        })


def update_particles(state):
    to_remove = []
    for p in state.particles:
        p["x"]  += p["vx"]
        p["y"]  += p["vy"]
        p["vy"] += 0.15
        p["vx"] *= 0.95
        p["life"] -= 0.03
        p["size"] *= 0.97
        if p["life"] <= 0:
            to_remove.append(p)
    for p in to_remove:
        state.particles.remove(p)


def update_player(state, move_left, move_right, jump_pressed):
    p = state.player
    level = state.level

    if move_left:
        p.vx -= ACCELERATION
        p.facing = -1
    if move_right:
        p.vx += ACCELERATION
        p.facing = 1

    friction = FRICTION_GROUND if p.on_ground else FRICTION_AIR
    p.vx *= friction
    if abs(p.vx) < 0.05:
        p.vx = 0.0

    p.vy += GRAVITY
    if p.vy > MAX_FALL:
        p.vy = MAX_FALL

    if jump_pressed:
        p.jump_buffer = JUMP_BUFFER
    elif p.jump_buffer > 0:
        p.jump_buffer -= 1

    can_jump = p.on_ground or p.coyote > 0
    if p.jump_buffer > 0 and can_jump:
        p.vy = JUMP_FORCE
        p.jump_buffer = 0
        p.coyote = 0
        p.squish = 0.6
        p.stretch = 1.4
        spawn_particles(state, p.x + p.w / 2, p.y + p.h, (100, 200, 255), 6, 3)

    was_on_ground = p.on_ground
    p.on_ground = False

    p.x += p.vx
    resolve_axis(p, level, "x")

    p.y += p.vy
    landed = resolve_axis(p, level, "y")

    if landed and not was_on_ground and p.vy > 2:
        p.squish = 0.65
        p.stretch = 0.8
        spawn_particles(state, p.x + p.w / 2, p.y + p.h, (100, 100, 120), 4, 1.5)

    p.squish  += (1.0 - p.squish)  * 0.2
    p.stretch += (1.0 - p.stretch) * 0.2

    if was_on_ground and not p.on_ground and p.vy > 0:
        p.coyote = COYOTE_FRAMES
    elif p.on_ground:
        p.coyote = 0
    elif p.coyote > 0:
        p.coyote -= 1

    if p.x < 0:
        p.x = 0
        p.vx = 0
    if p.x + p.w > level["width"]:
        p.x = level["width"] - p.w
        p.vx = 0

    margin = 2
    left  = int((p.x + margin) / TILE_SIZE)
    right = int((p.x + p.w - margin) / TILE_SIZE)
    top   = int((p.y + margin) / TILE_SIZE)
    bot   = int((p.y + p.h - margin) / TILE_SIZE)

    died = False
    reached_goal = False
    hit_ckpt = None

    for r in range(top, bot + 1):
        for c in range(left, right + 1):
            t = get_tile(level, c, r)
            if is_hazard(t):
                died = True
            elif t == "G":
                reached_goal = True
            elif t == "C":
                hit_ckpt = (c, r)

    if p.y > level["height"] + 200:
        died = True

    return died, reached_goal, hit_ckpt


def update_camera(state):
    p = state.player
    tx = p.x + p.w / 2 - SCREEN_W / 2
    ty = p.y + p.h / 2 - SCREEN_H / 2
    max_x = max(0, state.level["width"]  - SCREEN_W)
    max_y = max(0, state.level["height"] - SCREEN_H)
    tx = max(0.0, min(float(max_x), tx))
    ty = max(0.0, min(float(max_y), ty))
    state.cam_x += (tx - state.cam_x) * 0.1
    state.cam_y += (ty - state.cam_y) * 0.1


def draw_tile(surface, sx, sy, t, visited_ckpts, col, row, tick):
    TS = TILE_SIZE
    if t in ("P", "L"):
        pygame.draw.rect(surface, COL_PLATFORM,     (sx,      sy,       TS, TS))
        pygame.draw.rect(surface, COL_PLATFORM_TOP, (sx,      sy,       TS,  4))
        pygame.draw.rect(surface, COL_PLAT_SHADOW,  (sx,      sy+TS-3,  TS,  3))
    elif t == "K":
        pulse = math.sin(tick * 0.08 + col * 0.5) * 0.15 + 0.85
        pygame.draw.rect(surface, COL_HAZARD_DARK, (sx, sy, TS, TS))
        alpha = int(pulse * 220)
        hs = pygame.Surface((TS, TS), pygame.SRCALPHA)
        hs.fill((*COL_HAZARD, alpha))
        surface.blit(hs, (sx, sy))
        inner_alpha = int(pulse * 140)
        ins = pygame.Surface((TS - 8, TS - 8), pygame.SRCALPHA)
        ins.fill((*COL_HAZARD_INNER, inner_alpha))
        surface.blit(ins, (sx + 4, sy + 4))
    elif t == "C":
        active = (col, row) in visited_ckpts
        color  = COL_CKPT_ACTIVE if active else COL_CHECKPOINT
        lighter = tuple(min(255, c + 50) for c in color)
        pygame.draw.rect(surface, (20, 20, 30), (sx + 6, sy + 4, TS - 12, TS - 4))
        pygame.draw.rect(surface, color,   (sx + 8, sy + 2, TS - 16, TS - 8))
        pygame.draw.rect(surface, lighter, (sx + 10, sy + 4, TS - 20, 4))
    elif t == "G":
        pulse = math.sin(tick * 0.07 + row * 0.3) * 0.25 + 0.75
        gs = pygame.Surface((TS + 8, TS + 8), pygame.SRCALPHA)
        gs.fill((*COL_GOAL, int(pulse * 80)))
        surface.blit(gs, (sx - 4, sy - 4))
        pygame.draw.rect(surface, COL_GOAL, (sx + 4, sy + 4, TS - 8, TS - 8))


def draw_player(surface, state):
    p = state.player
    cx = p.x + p.w / 2
    cy = p.y + p.h / 2

    sy_val = p.squish if p.squish < 1 else p.stretch
    sx_val = (2.0 - sy_val) if sy_val < 1 else (1.0 / sy_val if sy_val > 1 else 1.0)

    dw = max(4, int(p.w * sx_val))
    dh = max(4, int(p.h * sy_val))
    dx = int(cx - dw / 2)
    dy = int(cy - dh / 2)

    pygame.draw.rect(surface, COL_PLAYER_DARK, (dx + 2, dy + 2, dw, dh))
    pygame.draw.rect(surface, COL_PLAYER,      (dx,     dy,     dw, dh))
    hl_w = max(1, dw - 8)
    hl_h = min(4, max(1, dh - 4))
    pygame.draw.rect(surface, COL_PLAYER_HL,   (dx + 4, dy + 3, hl_w, hl_h))

    eye_x = dx + int(dw * 0.65) if p.facing == 1 else dx + int(dw * 0.15)
    eye_y = dy + int(dh * 0.25)
    pygame.draw.rect(surface, COL_BLACK, (eye_x,     eye_y,     5, 5))
    pygame.draw.rect(surface, COL_WHITE, (eye_x + 1, eye_y,     2, 2))


def draw_particles(surface, state):
    for p in state.particles:
        alpha = int(max(0, min(255, p["life"] * 255)))
        size  = max(1, int(p["size"]))
        ps = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
        r, g, b = p["color"]
        ps.fill((r, g, b, alpha))
        surface.blit(ps, (int(p["x"]) - size, int(p["y"]) - size))


def draw_hud(surface, state, font, small_font):
    label = f"LEVEL {state.level_idx + 1}/{len(LEVELS)}   DEATHS: {state.deaths}"
    txt = font.render(label, True, COL_TEXT)
    bg = pygame.Surface((txt.get_width() + 12, 26), pygame.SRCALPHA)
    bg.fill((0, 0, 0, 140))
    surface.blit(bg,  (8,  8))
    surface.blit(txt, (14, 12))

    secs = state.time // 60
    mins = secs // 60
    ss   = secs % 60
    timer_txt = font.render(f"{mins:02d}:{ss:02d}", True, COL_TEXT_DIM)
    tw = timer_txt.get_width()
    tbg = pygame.Surface((tw + 16, 26), pygame.SRCALPHA)
    tbg.fill((0, 0, 0, 140))
    surface.blit(tbg,       (SCREEN_W - tw - 24, 8))
    surface.blit(timer_txt, (SCREEN_W - tw - 16, 12))

    hint = small_font.render(
        "[A/D] Move  [Space] Jump  [R] Restart  [Tab] Controls",
        True, COL_TEXT_DIM
    )
    surface.blit(hint, (SCREEN_W // 2 - hint.get_width() // 2, SCREEN_H - 18))


def draw_controls_overlay(surface, font, big_font):
    ov = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
    ov.fill((0, 0, 0, 190))
    surface.blit(ov, (0, 0))
    title = big_font.render("CONTROLS", True, COL_TEXT)
    surface.blit(title, (SCREEN_W // 2 - title.get_width() // 2, SCREEN_H // 2 - 100))
    lines = [
        "A / Arrow Left   — Move Left",
        "D / Arrow Right  — Move Right",
        "Space / Up       — Jump",
        "R                — Restart Level",
        "Tab              — Toggle This Screen",
    ]
    ctrl_font = pygame.font.SysFont("Courier New", 16)
    for i, line in enumerate(lines):
        t = ctrl_font.render(line, True, COL_TEXT_DIM)
        surface.blit(t, (SCREEN_W // 2 - t.get_width() // 2, SCREEN_H // 2 - 40 + i * 30))


def draw_win_screen(surface, state, font, big_font):
    ov = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
    ov.fill((0, 0, 0, 178))
    surface.blit(ov, (0, 0))
    win_txt = big_font.render("YOU WIN!", True, COL_GOAL)
    surface.blit(win_txt, (SCREEN_W // 2 - win_txt.get_width() // 2, SCREEN_H // 2 - 60))
    secs = state.time // 60
    mins = secs // 60
    ss   = secs % 60
    stats = font.render(
        f"Deaths: {state.deaths}   Time: {mins:02d}:{ss:02d}",
        True, COL_TEXT_DIM
    )
    surface.blit(stats, (SCREEN_W // 2 - stats.get_width() // 2, SCREEN_H // 2 + 10))
    restart = font.render("Press R to play again", True, COL_TEXT)
    surface.blit(restart, (SCREEN_W // 2 - restart.get_width() // 2, SCREEN_H // 2 + 50))


async def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    pygame.display.set_caption("2D Platformer")
    clock = pygame.time.Clock()

    font       = pygame.font.SysFont("Courier New", 14, bold=True)
    small_font = pygame.font.SysFont("Courier New", 11)
    big_font   = pygame.font.SysFont("Courier New", 36, bold=True)

    state = GameState(0)
    tick  = 0

    running = True
    while running:
        jump_pressed = False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_SPACE, pygame.K_UP, pygame.K_w):
                    jump_pressed = True
                if event.key == pygame.K_r:
                    if state.won:
                        state = GameState(0)
                    else:
                        state = GameState(
                            state.level_idx,
                            deaths=state.deaths,
                            total_time=state.time
                        )
                if event.key == pygame.K_TAB:
                    state.show_controls = not state.show_controls

        keys       = pygame.key.get_pressed()
        move_left  = keys[pygame.K_a] or keys[pygame.K_LEFT]
        move_right = keys[pygame.K_d] or keys[pygame.K_RIGHT]

        if not state.won and not state.show_controls:
            state.time += 1
            tick       += 1

            if state.death_flash > 0:
                state.death_flash -= 0.04

            if state.goal_flash > 0:
                state.goal_flash -= 0.025
                if state.goal_flash <= 0:
                    next_lvl = state.level_idx + 1
                    if next_lvl >= len(LEVELS):
                        state.won = True
                    else:
                        state = GameState(
                            next_lvl,
                            deaths=state.deaths,
                            total_time=state.time
                        )
            else:
                died, reached_goal, hit_ckpt = update_player(
                    state, move_left, move_right, jump_pressed
                )

                if died:
                    spawn_particles(
                        state,
                        state.player.x + state.player.w / 2,
                        state.player.y + state.player.h / 2,
                        COL_PLAYER, 16, 5
                    )
                    state.player.x  = state.ckpt_x
                    state.player.y  = state.ckpt_y
                    state.player.vx = 0.0
                    state.player.vy = 0.0
                    state.player.on_ground   = False
                    state.player.coyote      = 0
                    state.player.jump_buffer = 0
                    state.death_flash = 1.0
                    state.deaths += 1

                if hit_ckpt and hit_ckpt not in state.visited_ckpts:
                    state.visited_ckpts.add(hit_ckpt)
                    c, r = hit_ckpt
                    state.ckpt_x = c * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2
                    state.ckpt_y = r * TILE_SIZE - PLAYER_H
                    spawn_particles(
                        state,
                        state.player.x + state.player.w / 2,
                        state.player.y + state.player.h / 2,
                        COL_CHECKPOINT, 10, 3
                    )

                if reached_goal and state.goal_flash <= 0:
                    state.goal_flash = 1.0
                    spawn_particles(
                        state,
                        state.player.x + state.player.w / 2,
                        state.player.y + state.player.h / 2,
                        COL_GOAL, 20, 6
                    )

            update_particles(state)
            update_camera(state)

        # ── Render ──────────────────────────────────────────────────────────
        screen.fill(COL_BG)

        cam_x = int(state.cam_x)
        cam_y = int(state.cam_y)
        sc    = max(0, cam_x // TILE_SIZE - 1)
        ec    = min(state.level["cols"], (cam_x + SCREEN_W) // TILE_SIZE + 2)
        sr    = max(0, cam_y // TILE_SIZE - 1)
        er    = min(state.level["rows"], (cam_y + SCREEN_H) // TILE_SIZE + 2)

        for r in range(sr, er):
            for c in range(sc, ec):
                t = get_tile(state.level, c, r)
                if t == " ":
                    continue
                draw_tile(
                    screen,
                    c * TILE_SIZE - cam_x,
                    r * TILE_SIZE - cam_y,
                    t, state.visited_ckpts, c, r, tick
                )

        draw_particles(screen, state)

        if not state.won:
            draw_player(screen, state)

        if state.death_flash > 0:
            fl = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
            fl.fill((255, 30, 30, int(state.death_flash * 120)))
            screen.blit(fl, (0, 0))

        if state.goal_flash > 0:
            fl = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
            fl.fill((64, 255, 112, int(state.goal_flash * 120)))
            screen.blit(fl, (0, 0))

        if not state.won:
            draw_hud(screen, state, font, small_font)

        if state.show_controls and not state.won:
            draw_controls_overlay(screen, font, big_font)

        if state.won:
            draw_win_screen(screen, state, font, big_font)

        pygame.display.flip()
        clock.tick(FPS)
        await asyncio.sleep(0)

    pygame.quit()


asyncio.run(main())
