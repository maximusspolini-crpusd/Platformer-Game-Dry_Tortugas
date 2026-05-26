// Momentum-based platformer — redesigned levels
// 13 rows tall, floor at row 10, lava at row 11, base at row 12
// Floating platforms in rows 3-7 act as slow-path stepping stones
// Fast players clear gaps directly; slow players can use the stepping stones
//
// Physics reference: ground terminal vx ≈ 13 px/frame
// Jump arc at max speed ≈ 18 tiles horizontal
// Gap guide:  4=trivial  5=easy  6-7=medium  9-10=hard  12-13=very hard  15-18=extreme

export const LEVELS: string[] = [

// ─── LEVEL 1 ─── "First Steps"  70 wide
// Gaps: 4, 5, 6  — floating stepping stones above each gap
// Learn: run fast → jump far. Slow = use the stones above.
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                    P
P                                                                    P
P                                                                    P
P                 PPPP        PPPPP         PPPPP                    P
P                                                                    P
P                                                                    P
P                                                                    P
P                                                                    P
P  S                                                             G  P
PPPPPPPPPPPPPPPPPP    PPPPPPPPPPPP     PPPPPPPPPPP      PPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPKKKKPPPPPPPPPPPPKKKKKPPPPPPPPPPPKKKKKKPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 2 ─── "Gathering Speed"  90 wide
// Gaps: 5, 7, 11  — a raised bridge above the final big gap
// You can hop up to the bridge OR clear the 11-tile gap at speed
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                        P
P                                                                                        P
P                    PPPPP                                                               P
P                                                   PPPPPPPPPPPPP                       P
P                                                                                        P
P                                                                                        P
P                                                                                        P
P                                                                                        P
P  S                                                                                 G  P
PPPPPPPPPPPPPPPPPPPPPP     PPPPPPPPPPPPPPP       PPPPPPPPPPPPPP           PPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPKKKKKPPPPPPPPPPPPPPPKKKKKKKPPPPPPPPPPPPPPKKKKKKKKKKKPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 3 ─── "River Run"  105 wide
// Gaps: 6, 9, 13  — platforms at different heights, need speed for the 13-tile gap
// Stepping stones are higher up — harder to reach at low speed
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                       P
P                                                                                                       P
P                     PPPP                                   PPPPPP                                     P
P                                                                                                       P
P                                       PPPP                                                            P
P                                                                           PPPPP                       P
P                                                                                                       P
P                                                                                                       P
P  S                                                                                                G  P
PPPPPPPPPPPPPPPPPPPPPPPPPP      PPPPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPPPP             PPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKLPPPPPPPPPPPPPPPPPPKKKKKKKKKPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 4 ─── "Overdrive"  120 wide
// Gaps: 8, 12, 16  — the 16-tile gap is a wall of lava, no stepping stones
// You need near-max speed. The previous gaps build up your confidence.
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                        P
P                                                                                                                        P
P                      PPPP                                                                                              P
P                                             PPPP                                                                       P
P                                                                                                                        P
P                                                              PPPP                                                      P
P                                                                                                                        P
P                                                                                                                        P
P  S                                                                                                                 G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP        PPPPPPPPPPPPPPPPPPPP            PPPPPPPPPPPPPPPPPP                PPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 5 ─── "Hyperlane"  140 wide
// Gaps: 9, 13, 18  — no stepping stones on the 18-tile gap at all
// Hold right from the start, hold space throughout, never stop
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                                                   P
P                                                                                                                                                   P
P                        PPPP                                                                                                                       P
P                                              PPPPP                                                                                                P
P                                                                                                                                                   P
P                                                                                                                                                   P
P                                                                                                                                                   P
P                                                                                                                                                   P
P  S                                                                                                                                            G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPPPPPPPPPPPP             PPPPPPPPPPPPPPPPPPPPPPPP                  PPPPPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─── LEVEL 6 ─── "Grand Prix"  160 wide, 4 GAPS
// Gaps: 12, 16, 18, 8  — the 18 is the wall, preceded by two momentum killers
// The ONLY way to clear the 18-tile gap is to have full speed built before it.
// After the 18, a short 8-tile recovery gap before the goal — don't land on lava!
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                                                                 P
P                                                                                                                                                                 P
P                         PPPP                                                                                                                                    P
P                                                  PPPP                                                                                                           P
P                                                                                                                                                                 P
P                                                                                                                                                                 P
P                                                                                                                                                                 P
P                                                                                                                                                                 P
P  S                                                                                                                                                          G  P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP            PPPPPPPPPPPPPPPPPPPP                PPPPPPPPPPPPPPPPPPPP                  PPPPPPPPPPPPPPPPPPPP        PPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPKKKKKKKKKKKKKKKKKKPPPPPPPPPPPPPPPPPPPPKKKKKKKKPPPPPPPPPPPPPPPPPP
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,
];
