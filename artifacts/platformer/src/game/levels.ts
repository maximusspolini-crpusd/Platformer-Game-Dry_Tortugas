// Momentum-based levels
// Physics reference: terminal vx ~13 px/frame on ground, ~unlimited in air (friction 0.997)
// Jump arc at max speed: ~24 tiles horizontal distance
// Gap sizes: 4=easy, 7=medium, 10=hard, 14=needs speed, 18=near-max, 22=max speed
// All levels designed around building and sustaining momentum
// Hold SPACE to auto-jump on landing!

export const LEVELS: string[] = [

// ─────────────────────────────────────────────────────────────────
// LEVEL 1 — "Rolling Start"
// Intro to momentum. Short runways, small gaps that grow.
// Gaps: 4, 5, 6, 7 tiles — learn that faster = farther
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                            P
P                                                                            P
P                                                                            P
P                                                                            P
P                                                                            P
P  S                      C                    C                       G    P
PPPPPPPPPPPPPPPPPPPP    PPPPPPPPPPPPPPP     PPPPPPPPPPPPPPP      PPPPPPPPPPPPPP
P                   KKKK              KKKKKKK              KKKKKKK            P
P                   KKKK              KKKKKKK              KKKKKKK            P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─────────────────────────────────────────────────────────────────
// LEVEL 2 — "Speed Alley"
// Longer runways. Gaps grow to need real momentum.
// Hold space and run — don't stop!
// Gaps: 5, 7, 9, 7, 5 tiles
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                        P
P                                                                                        P
P                                                                                        P
P                                                                                        P
P  S                     C                      C                    C              G   P
PPPPPPPPPPPPPPPPPPPP    PPPPPPPPPPPPPPP      PPPPPPPPPPPPPP      PPPPPPPPP   PPPPPPPPPPPPP
P                   KKKKK              KKKKKKK              KKKKKKK       KKK            P
P                   KKKKK              KKKKKKK              KKKKKKK       KKK            P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─────────────────────────────────────────────────────────────────
// LEVEL 3 — "Canyon Run"
// Two-tier level. Drop down to the lower floor to build speed.
// Upper platforms give shortcuts but lower path has momentum.
// Gaps: 7, 10, 12, 9 tiles — need real speed to clear the big ones
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                              P
P                                                                                              P
P                                                          PPPP      PPPPPPP                   P
P                 PPPPPPPPPP            PPPPPPPPP                               G              P
P  S                                                                         PPPPPPPPPPPPPPPPPP
P  PPPPPPPPPPPPPP           PPPPPPPPPP           PPPPPPPPPP          PPPPPPP                   P
P                KKKKKKKKKKK          KKKKKKKKKKKK          KKKKKKKKKK       KKKK              P
P                KKKKKKKKKKK          KKKKKKKKKKKK          KKKKKKKKKK       KKKK              P
P                KKKKKKKKKKK          KKKKKKKKKKKK          KKKKKKKKKK       KKKK              P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─────────────────────────────────────────────────────────────────
// LEVEL 4 — "The Long Haul"
// No checkpoints for first half — maintain momentum or fall.
// Gaps: 8, 11, 14, 11, 8 tiles — the 14-tile gap needs near-max speed
// Two floors: top for slow path (narrow platforms), bottom for speed path
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                             P
P                                                                                                             P
P         PPPP          PPPP            PPPP              PPPP          PPPP          PPPP                    P
P                                                                                                             P
P  S                C                           C                                              C       G      P
P  PPPPPPPPPPPPPP       PPPPPPPPPPPPPPP                 PPPPPPPPPPPPPP       PPPPPPPPPPPPP      PPPPPPPPPPPPPPPP
P                KKKKKKKKK             KKKKKKKKKKKKKKKKKK             KKKKKKKKK            KKKKKK              P
P                KKKKKKKKK             KKKKKKKKKKKKKKKKKK             KKKKKKKKK            KKKKKK              P
P                KKKKKKKKK             KKKKKKKKKKKKKKKKKK             KKKKKKKKK            KKKKKK              P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─────────────────────────────────────────────────────────────────
// LEVEL 5 — "Hyperdrive"
// Long runways and massive gaps. You need to be at near-max speed.
// The 16-tile gap is only crossable at high speed. Don't slow down!
// Gaps: 10, 13, 16, 13, 10 tiles
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                             P
P                                                                                                                             P
P                                          PPPP                PPPP                                                           P
P              PPPPP               PPPP                                  PPPP             PPPP              PPPP              P
P  S                      C                           C                                                              G        P
P  PPPPPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPPPPP              PPPPPPPPPPPPPPPPPPP           PPPPPPPPPPPPPPP          PPPPPPPP
P                    KKKKKKKKKKKK                KKKKKKKKKKKKKKKK                 KKKKKKKKKKKK             KKKKKKKKKKKK       P
P                    KKKKKKKKKKKK                KKKKKKKKKKKKKKKK                 KKKKKKKKKKKK             KKKKKKKKKKKK       P
P                    KKKKKKKKKKKK                KKKKKKKKKKKKKKKK                 KKKKKKKKKKKK             KKKKKKKKKKKK       P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,

// ─────────────────────────────────────────────────────────────────
// LEVEL 6 — "Grand Prix"
// The ultimate speed run. Hold right, hold space, never stop.
// Gaps: 12, 15, 18, 15, 12 — the 18-tile gap REQUIRES max speed.
// Speed bonus: faster you run, higher you jump. Max speed = win.
// ─────────────────────────────────────────────────────────────────
`PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
P                                                                                                                                                     P
P                                                                                                                                                     P
P                                                    PPPP                   PPPP                    PPPP                                              P
P               PPPP             PPPP                                                                           PPPP              PPPP                P
P  S                        C                                  C                                                           C                   G      P
P  PPPPPPPPPPPPPPPPPPP         PPPPPPPPPPPPPPPPPPPP                  PPPPPPPPPPPPPPPPPPPPPP             PPPPPPPPPPPPPPPPPP          PPPPPPPPPPPPPPPPPPP
P                    KKKKKKKKKKKKK                  KKKKKKKKKKKKKKKKKKK                   KKKKKKKKKKKKKKKK               KKKKKKKKKKKKK                P
P                    KKKKKKKKKKKKK                  KKKKKKKKKKKKKKKKKKK                   KKKKKKKKKKKKKKKK               KKKKKKKKKKKKK                P
P                    KKKKKKKKKKKKK                  KKKKKKKKKKKKKKKKKKK                   KKKKKKKKKKKKKKKK               KKKKKKKKKKKKK                P
PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP`,
];
