// Dinosaurs (friendly cartoon style) — 15 distinct subjects:
// 1 T-rex, 2 triceratops, 3 stegosaurus, 4 brachiosaurus beside a tree, 5 baby hatching from an egg,
// 6 pterodactyl in the sky, 7 ankylosaurus, 8 parasaurolophus, 9 spinosaurus, 10 volcano with footprints,
// 11 nest with three eggs, 12 smiling dino face, 13 birthday dino with cake, 14 pachycephalosaurus,
// 15 baby dino in a jungle with a palm tree.
import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => Math.round(n * 10) / 10;

/** Closed bump (tail, leg, horn, plate...) attached to a circle between angles a1<a2 (degrees, y down). */
function lobe(p: Pen, cx: number, cy: number, R: number, a1: number, a2: number, out: number, w = 0): void {
  const P = (a: number, r: number) => `${f(cx + r * Math.cos(rad(a)))} ${f(cy + r * Math.sin(rad(a)))}`;
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const h = rad((a2 - a1 + 2 * w) / 2);
  const rc = (R + out - 0.25 * R * Math.cos(rad((a2 - a1) / 2))) / (0.75 * Math.cos(h));
  p.path(`M${P(a1, R)} C${P(a1 - w, rc)} ${P(a2 + w, rc)} ${P(a2, R)} A${R} ${R} 0 ${large} 0 ${P(a1, R)} Z`);
}

/** Outline of the union of two overlapping circles. */
function union(p: Pen, x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + (dx * a) / d;
  const my = y1 + (dy * a) / d;
  let A = [mx + (h * dy) / d, my - (h * dx) / d];
  let B = [mx - (h * dy) / d, my + (h * dx) / d];
  const TAU = Math.PI * 2;
  const mod = (v: number) => ((v % TAU) + TAU) % TAU;
  const ang = (pt: number[], cx: number, cy: number) => Math.atan2(pt[1]! - cy, pt[0]! - cx);
  const th = Math.atan2(dy, dx);
  const s0 = mod(ang(B, x1, y1) - ang(A, x1, y1));
  if (mod(th - ang(A, x1, y1)) < s0) [A, B] = [B, A];
  const s1 = mod(ang(B, x1, y1) - ang(A, x1, y1));
  const s2 = mod(ang(A, x2, y2) - ang(B, x2, y2));
  p.path(
    `M${f(A[0]!)} ${f(A[1]!)} A${r1} ${r1} 0 ${s1 > Math.PI ? 1 : 0} 1 ${f(B[0]!)} ${f(B[1]!)} A${r2} ${r2} 0 ${s2 > Math.PI ? 1 : 0} 1 ${f(A[0]!)} ${f(A[1]!)} Z`,
  );
}

type Seg = ['L', number, number] | ['Q', number, number, number, number] | ['C', number, number, number, number, number, number];

/** Part glued to an ellipse between params t1<t2 (degrees); segs use absolute coordinates. */
function part(p: Pen, cx: number, cy: number, rx: number, ry: number, t1: number, t2: number, segs: Seg[]): void {
  const e = (t: number) => [cx + rx * Math.cos(rad(t)), cy + ry * Math.sin(rad(t))];
  const a = e(t1);
  const b = e(t2);
  let d = `M${f(a[0]!)} ${f(a[1]!)}`;
  for (const s of segs) {
    if (s[0] === 'L') d += ` L${s[1]} ${s[2]}`;
    else if (s[0] === 'Q') d += ` Q${s[1]} ${s[2]} ${s[3]} ${s[4]}`;
    else d += ` C${s[1]} ${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]}`;
  }
  d += ` L${f(b[0]!)} ${f(b[1]!)} A${rx} ${ry} 0 ${Math.abs(t2 - t1) > 180 ? 1 : 0} ${t2 > t1 ? 0 : 1} ${f(a[0]!)} ${f(a[1]!)} Z`;
  p.path(d);
}

function eyes(p: Pen, x: number, y: number, r: number): void {
  p.circle(x, y, r);
  p.circle(x, y, r * 0.45);
}

function cloud(p: Pen, x: number, y: number, s: number): void {
  const q = (n: number) => f(n * s);
  p.path(
    `M${x + q(0.12)} ${y} A${q(0.12)} ${q(0.12)} 0 0 1 ${x + q(0.16)} ${y - q(0.22)} A${q(0.2)} ${q(0.2)} 0 0 1 ${x + q(0.5)} ${y - q(0.3)} A${q(0.22)} ${q(0.22)} 0 0 1 ${x + q(0.85)} ${y - q(0.2)} A${q(0.13)} ${q(0.13)} 0 0 1 ${x + q(0.88)} ${y} Z`,
  );
}

function sun(p: Pen, x: number, y: number, r: number): void {
  p.circle(x, y, r);
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45);
    p.line(x + (r + 22) * Math.cos(a), y + (r + 22) * Math.sin(a), x + (r + 60) * Math.cos(a), y + (r + 60) * Math.sin(a));
  }
}

export const pages: PageDef[] = [
  // 1 T-rex
  page('dinosaurs', 1, (p) => {
    union(p, 400, 610, 200, 640, 380, 165); // body + head
    lobe(p, 400, 610, 200, 163, 197, 140, 0); // tail
    lobe(p, 400, 610, 200, 52, 80, 120, 0); // legs
    lobe(p, 400, 610, 200, 100, 128, 120, 0);
    lobe(p, 400, 610, 200, 3, 26, 85, 0); // little arm
    lobe(p, 640, 380, 165, -22, 14, 100, 0); // snout
    eyes(p, 650, 310, 32);
    p.circle(890, 355, 13); // nostril
    p.path('M690 440 Q800 500 905 420'); // smile
    p.poly([[735, 470], [775, 480], [752, 512]]); // teeth
    p.poly([[810, 478], [848, 470], [832, 505]]);
    p.ellipse(400, 690, 110, 65); // belly patch
    p.circle(340, 540, 38);
    p.circle(460, 500, 32);
  }),

  // 2 triceratops
  page('dinosaurs', 2, (p) => {
    union(p, 440, 600, 220, 720, 450, 135); // body + head
    lobe(p, 720, 450, 135, 215, 295, 160, 0); // frill
    lobe(p, 720, 450, 135, -62, -42, 130, 0); // brow horns
    lobe(p, 720, 450, 135, -18, 4, 80, 0); // nose horn
    lobe(p, 440, 600, 220, 160, 200, 150, 0); // tail
    lobe(p, 440, 600, 220, 52, 78, 130, 0); // legs
    lobe(p, 440, 600, 220, 102, 128, 130, 0);
    eyes(p, 760, 440, 28);
    p.circle(590, 340, 26); // frill spots
    p.circle(660, 290, 26);
    p.path('M730 530 Q790 575 860 520'); // smile
    p.circle(390, 560, 40);
    p.circle(500, 650, 34);
  }),

  // 3 stegosaurus
  page('dinosaurs', 3, (p) => {
    union(p, 500, 600, 220, 775, 650, 95); // body + head
    lobe(p, 500, 600, 220, 160, 200, 200, 0); // tail
    lobe(p, 500, 600, 220, 55, 80, 120, 0); // legs
    lobe(p, 500, 600, 220, 100, 125, 120, 0);
    const plates: [number, number, number][] = [
      [-167, -145, 80],
      [-140, -118, 105],
      [-113, -91, 120],
      [-86, -64, 105],
      [-59, -37, 80],
    ];
    for (const [a1, a2, o] of plates) lobe(p, 500, 600, 220, a1, a2, o, 0);
    eyes(p, 790, 630, 24);
    p.path('M770 690 Q810 715 850 680');
    p.circle(450, 590, 40);
    p.circle(560, 660, 34);
  }),

  // 4 brachiosaurus + tree
  page('dinosaurs', 4, (p) => {
    p.ellipse(380, 690, 260, 170); // body
    part(p, 380, 690, 260, 170, -75, -35, [
      ['L', 455, 360],
      ['L', 480, 270],
      ['Q', 540, 190, 630, 225],
      ['Q', 700, 255, 680, 310],
      ['Q', 650, 335, 585, 335],
      ['L', 585, 420],
    ]); // neck + head
    part(p, 380, 690, 260, 170, 165, 200, [
      ['L', 80, 730],
      ['Q', 30, 690, 80, 640],
    ]); // tail
    part(p, 380, 690, 260, 170, 55, 85, [
      ['L', 535, 905],
      ['L', 425, 905],
    ]); // legs
    part(p, 380, 690, 260, 170, 100, 130, [
      ['L', 280, 905],
      ['L', 215, 905],
    ]);
    eyes(p, 610, 258, 24);
    p.circle(700, 290, 11);
    p.path('M610 310 Q650 325 685 300');
    p.circle(340, 650, 42);
    p.circle(450, 720, 34);
    p.circle(850, 400, 120); // tree crown
    p.path('M820 505 Q835 700 800 905 L910 905 Q875 700 880 505 A120 120 0 0 1 820 505 Z'); // trunk
    p.path('M60 930 L940 930');
  }),

  // 5 baby hatching
  page('dinosaurs', 5, (p) => {
    p.path('M160 540 L160 580 L240 500 L320 580 L400 500 L480 580 L560 500 L640 580 L720 500 L800 580 L840 540 A340 360 0 0 1 160 540 Z'); // egg half
    p.path('M320 580 A160 200 0 0 1 640 580 L560 500 L480 580 L400 500 Z'); // baby head
    eyes(p, 420, 440, 36);
    eyes(p, 540, 440, 36);
    p.circle(450, 520, 11);
    p.circle(510, 520, 11);
    p.path('M430 555 Q480 590 540 555');
    p.circle(480, 350, 28);
    p.circle(370, 790, 42); // shell spots
    p.circle(590, 740, 50);
    p.circle(480, 870, 28);
    p.poly([[70, 880], [140, 820], [170, 900]]); // shell bits
    p.poly([[860, 840], [930, 800], [920, 900]]);
    p.path('M60 950 Q200 920 340 950 T620 950 T940 950');
  }),

  // 6 pterodactyl
  page('dinosaurs', 6, (p) => {
    union(p, 500, 590, 150, 590, 400, 90); // body + head
    lobe(p, 590, 400, 90, -14, 12, 210, 0); // beak
    lobe(p, 590, 400, 90, 195, 230, 130, 0); // crest
    lobe(p, 500, 590, 150, 78, 102, 110, 0); // tail
    const wing = (s: number) => {
      const X = (v: number) => (s === 1 ? v : 1000 - v);
      p.path(
        `M${X(366)} 520 C${X(260)} 410 ${X(150)} 330 ${X(70)} 270 Q${X(70)} 400 ${X(140)} 450 Q${X(125)} 565 ${X(215)} 590 Q${X(235)} 680 ${X(370)} 665 A150 150 0 0 ${s === 1 ? 1 : 0} ${X(366)} 520 Z`,
      );
      p.line(X(366), 540, X(110), 330);
    };
    wing(1);
    wing(-1);
    eyes(p, 590, 385, 26);
    cloud(p, 70, 900, 360);
    cloud(p, 590, 940, 330);
  }),

  // 7 ankylosaurus
  page('dinosaurs', 7, (p) => {
    union(p, 470, 590, 250, 770, 680, 100); // body + head
    lobe(p, 470, 590, 250, 160, 200, 150, 0); // tail
    lobe(p, 470, 590, 250, 52, 76, 140, 0); // legs
    lobe(p, 470, 590, 250, 104, 128, 140, 0);
    for (let i = 0; i < 6; i++) lobe(p, 470, 590, 250, -160 + i * 22, -142 + i * 22, 55, 0); // spikes
    p.ellipse(330, 520, 62, 42, -0.5); // armor plates
    p.ellipse(470, 470, 62, 42, 0);
    p.ellipse(610, 520, 62, 42, 0.5);
    p.ellipse(400, 640, 62, 42, -0.2);
    p.ellipse(550, 650, 62, 42, 0.2);
    eyes(p, 800, 660, 26);
    p.path('M770 735 Q810 758 850 725');
  }),

  // 8 parasaurolophus
  page('dinosaurs', 8, (p) => {
    p.circle(420, 620, 210); // body
    part(p, 420, 620, 210, 210, -72, -38, [
      ['L', 500, 330],
      ['L', 520, 250],
      ['L', 480, 175],
      ['Q', 420, 100, 330, 110],
      ['Q', 300, 150, 350, 180],
      ['Q', 420, 170, 450, 225],
      ['Q', 520, 215, 610, 245],
      ['Q', 680, 275, 650, 325],
      ['Q', 610, 345, 560, 325],
      ['L', 570, 440],
    ]); // neck + head with crest
    lobe(p, 420, 620, 210, 160, 200, 150, 0); // tail
    lobe(p, 420, 620, 210, 52, 78, 140, 0); // legs
    lobe(p, 420, 620, 210, 102, 128, 140, 0);
    eyes(p, 560, 270, 24);
    p.circle(645, 300, 10);
    p.path('M570 310 Q610 335 650 312');
    p.path('M360 150 Q420 160 460 220'); // crest stripe
    p.circle(360, 580, 40);
    p.circle(470, 660, 34);
    p.circle(380, 700, 24);
  }),

  // 9 spinosaurus
  page('dinosaurs', 9, (p) => {
    union(p, 430, 620, 200, 690, 480, 100); // body + head
    lobe(p, 430, 620, 200, -150, -50, 150, 0); // sail
    lobe(p, 690, 480, 100, -14, 20, 150, 0); // snout
    lobe(p, 430, 620, 200, 160, 200, 160, 0); // tail
    lobe(p, 430, 620, 200, 52, 78, 130, 0); // legs
    lobe(p, 430, 620, 200, 102, 128, 130, 0);
    lobe(p, 430, 620, 200, 12, 32, 75, 0); // arm
    for (const a of [-125, -100, -75]) p.line(430 + 210 * Math.cos(rad(a)), 620 + 210 * Math.sin(rad(a)), 430 + 310 * Math.cos(rad(a)), 620 + 310 * Math.sin(rad(a)));
    eyes(p, 700, 450, 26);
    p.circle(820, 470, 10);
    p.path('M720 530 Q800 570 870 520');
    p.circle(380, 620, 38);
    p.circle(480, 700, 32);
  }),

  // 10 volcano + footprints
  page('dinosaurs', 10, (p) => {
    p.path('M150 800 L400 320 A100 30 0 0 0 600 320 L850 800 Z'); // mountain
    p.ellipse(500, 320, 100, 30); // crater
    p.path('M440 344 Q420 450 470 500 Q430 580 470 690 Q500 750 530 690 Q570 580 530 500 Q580 450 560 344 A100 30 0 0 1 440 344 Z'); // lava
    cloud(p, 250, 230, 280);
    cloud(p, 520, 140, 230);
    sun(p, 850, 160, 55);
    p.rect(60, 800, 880, 150); // ground
    for (const [x, y] of [[260, 880], [500, 890], [740, 880]] as [number, number][]) {
      p.ellipse(x, y + 20, 38, 30);
      p.circle(x - 42, y - 24, 16);
      p.circle(x, y - 40, 16);
      p.circle(x + 42, y - 24, 16);
    }
  }),

  // 11 nest with three eggs
  page('dinosaurs', 11, (p) => {
    p.path('M100 640 L900 640 A400 270 0 0 1 100 640 Z'); // nest
    p.path('M215 640 A85 190 0 0 1 385 640 Z'); // eggs
    p.path('M415 640 A85 230 0 0 1 585 640 Z');
    p.path('M600 640 A85 190 0 0 1 770 640 Z');
    p.circle(300, 540, 32); // egg spots
    p.circle(500, 480, 38);
    p.circle(685, 540, 32);
    p.circle(500, 590, 20);
    p.path('M160 700 Q400 790 700 700'); // twigs
    p.path('M300 800 Q550 740 840 760');
    p.path('M200 760 Q300 830 480 840');
    sun(p, 150, 190, 60);
    cloud(p, 640, 230, 260);
    p.path('M60 930 Q200 900 340 930 T620 930 T940 930');
  }),

  // 12 smiling dino face
  page('dinosaurs', 12, (p) => {
    p.circle(500, 540, 300); // head
    lobe(p, 500, 540, 300, -135, -107, 120, 0); // crest spikes
    lobe(p, 500, 540, 300, -97, -73, 160, 0);
    lobe(p, 500, 540, 300, -63, -35, 120, 0);
    eyes(p, 370, 440, 55);
    eyes(p, 630, 440, 55);
    p.ellipse(500, 660, 170, 100); // muzzle
    p.circle(445, 630, 13);
    p.circle(555, 630, 13);
    p.path('M410 690 Q500 770 590 690'); // smile
    p.circle(280, 600, 38); // cheeks
    p.circle(720, 600, 38);
    p.circle(500, 320, 28); // forehead spots
    p.circle(430, 280, 20);
    p.circle(570, 280, 20);
  }),

  // 13 birthday dino with cake
  page('dinosaurs', 13, (p) => {
    p.circle(500, 305, 140); // head
    lobe(p, 500, 305, 140, -112, -68, 110, 0); // party hat
    lobe(p, 500, 305, 140, -165, -140, 45, 0); // crest bumps
    lobe(p, 500, 305, 140, -40, -15, 45, 0);
    eyes(p, 440, 280, 30);
    eyes(p, 560, 280, 30);
    p.circle(500, 370, 28); // blowing mouth
    p.circle(375, 350, 22); // cheeks
    p.circle(625, 350, 22);
    p.roundRect(220, 655, 560, 110, 16); // cake top tier
    p.roundRect(130, 765, 740, 170, 20); // bottom tier
    for (const x of [350, 500, 650]) {
      p.roundRect(x - 18, 560, 36, 95, 6); // candle
      p.path(`M${x} 500 Q${x - 30} 535 ${x} 548 Q${x + 30} 535 ${x} 500 Z`); // flame
    }
    p.path('M240 700 L760 700');
    p.circle(230, 850, 18);
    p.circle(400, 865, 18);
    p.circle(600, 865, 18);
    p.circle(770, 850, 18);
  }),

  // 14 pachycephalosaurus
  page('dinosaurs', 14, (p) => {
    union(p, 450, 620, 210, 660, 380, 135); // body + head
    lobe(p, 660, 380, 135, -140, -40, 45, 0); // dome
    lobe(p, 450, 620, 210, 160, 200, 170, 0); // tail
    lobe(p, 450, 620, 210, 52, 78, 140, 0); // legs
    lobe(p, 450, 620, 210, 102, 128, 140, 0);
    lobe(p, 450, 620, 210, 5, 28, 80, 0); // arm
    for (const a of [-140, -90, -40]) p.circle(660 + 150 * Math.cos(rad(a)), 380 + 150 * Math.sin(rad(a)), 22);
    eyes(p, 700, 390, 30);
    p.circle(770, 420, 11);
    p.path('M670 450 Q730 490 800 440');
    p.ellipse(440, 690, 110, 70);
    p.circle(380, 560, 38);
    p.circle(500, 540, 30);
  }),

  // 15 baby dino in the jungle
  page('dinosaurs', 15, (p) => {
    p.circle(715, 260, 55); // palm crown
    for (const c of [20, -35, -90, -145, 160]) lobe(p, 715, 260, 55, c - 17, c + 17, 150, 0);
    p.path('M690 313 Q715 500 675 880 L790 880 Q750 500 740 313 A55 55 0 0 1 690 313 Z'); // trunk
    p.path('M760 450 L790 450 M755 560 L790 560 M745 680 L780 680');
    union(p, 330, 730, 165, 490, 600, 90); // baby dino
    lobe(p, 330, 730, 165, 158, 202, 100, 0); // tail
    lobe(p, 330, 730, 165, 60, 82, 80, 0); // legs
    lobe(p, 330, 730, 165, 98, 120, 80, 0);
    lobe(p, 490, 600, 90, -135, -105, 70, 0); // crest
    lobe(p, 490, 600, 90, -95, -65, 85, 0);
    eyes(p, 520, 585, 24);
    p.path('M505 640 Q540 665 570 635');
    p.circle(300, 700, 30);
    p.circle(380, 790, 22);
    sun(p, 160, 170, 62);
    p.path('M60 920 Q200 890 340 920 T620 920 T940 920');
  }),
];
