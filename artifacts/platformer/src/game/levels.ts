// Momentum-based platformer levels — no checkpoints, clean design
//
// Physics: ground terminal vx ≈ 13 px/frame, air friction ≈ 0 loss
// Jump arc at max speed ≈ 18 tiles horizontal distance
//
// Gap guide (tiles):
//   4  = trivial (any speed)
//   5  = easy
//   7  = medium (need some runway)
//   9  = hard (need decent speed)
//  11  = very hard (near-max speed)
//  14  = extreme (need full build-up)
//  17  = near-max speed required
//  18  = absolute maximum — full commitment

export const LEVELS: string[] = [

// ─── LEVEL 1 ─── "First Steps"  (width 60)
// Gaps: 4, 5, 6 — learn that more runway = more distance
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                          P
P                                                          P
P  S                                                    G  P
PPPPPPPPPPPPPPPP    PPPPPPPPPPP     PPPPPPPPPP      PPPPPPPP
PPPPPPPPPPPPPPPPKKKKPPPPPPPPPPPKKKKKPPPPPPPPPPKKKKKKPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 2 ─── "Gathering Speed"  (width 80)
// Gaps: 5, 7, 10 — hold right, hold space, keep going
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                              P
P                                                                              P
P  S                                                                        G  P
PPPPPPPPPPPPPPPPPPPP     PPPPPPPPPPPPPP       PPPPPPPPPPPPP          PPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPKKKKKPPPPPPPPPPPPPPKKKKKKKPPPPPPPPPPPPPKKKKKKKKKKPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 3 ─── "River Run"  (width 95)
// Gaps: 6, 9, 12 — the last gap needs real speed
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                             P
P                                                                                             P
P  S                                                                                       G  P
PPPPPPPPPPPPPPPPPPPPPPPP      PPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPP            PPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPKKKKKKLPPPPPPPPPPPPPPPKKKKKKKKKPPPPPPPPPPPPPPPKKKKKKKKKKKKPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 4 ─── "Overdrive"  (width 110)
// Gaps: 8, 11, 14 — the 14-tile gap demands a full runway, no hesitation
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                             P
P                                                                                                             P
P  S                                                                                                       G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPP        PPPPPPPPPPPPPPPPPP           PPPPPPPPPPPPPPPPP              PPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKPPPPPPPPPPPPPPPPPPKKKKKKKKKKKPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 5 ─── "Hyperlane"  (width 130)
// Gaps: 9, 13, 17 — the 17-tile gap is almost impossible without max speed
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                             P
P                                                                                                                             P
P  S                                                                                                                       G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPPPPPPPPP             PPPPPPPPPPPPPPPPPPPPP                 PPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 6 ─── "Grand Prix"  (width 150)
// Gaps: 12, 16, 18 — the 18-tile center gap is only crossable at absolute max speed
// Hold right from the very start and never let go
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                                                     P
P                                                                                                                                                     P
P  S                                                                                                                                               G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP            PPPPPPPPPPPPPPPPPPPPPPPPPP                PPPPPPPPPPPPPPPPPPPPPPPP                  PPPPPPPPPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,
];
