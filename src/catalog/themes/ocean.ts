// Ocean — 15 distinct subjects:
// 1 clownfish, 2 octopus, 3 whale with spout, 4 crab, 5 starfish with shells, 6 seahorse,
// 7 jellyfish, 8 sea turtle (top view), 9 leaping dolphin, 10 friendly shark, 11 pufferfish,
// 12 sailboat on waves (sun + cloud), 13 treasure chest on the seabed, 14 lighthouse on a rock,
// 15 coral reef with two little fish.
import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => Math.round(n * 10) / 10;
const loc = (cx: number, cy: number, rot: number, X: number, Y: number): [number, number] => [
  cx + X * Math.cos(rot) - Y * Math.sin(rot),
  cy + X * Math.sin(rot) + Y * Math.cos(rot),
];

/** Closed bump attached to a circle between angles a1<a2 (degrees, y down). */
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

/** Fin / tail / leg glued to an (optionally rotated) ellipse between params t1<t2; segs in ellipse-local coords. */
function fin(p: Pen, cx: number, cy: number, rx: number, ry: number, rot: number, t1: number, t2: number, segs: Seg[]): void {
  const e = (t: number) => loc(cx, cy, rot, rx * Math.cos(rad(t)), ry * Math.sin(rad(t)));
  const pt = (X: number, Y: number) => loc(cx, cy, rot, X, Y).map(f).join(' ');
  const a = e(t1);
  const b = e(t2);
  let d = `M${a.map(f).join(' ')}`;
  for (const s of segs) {
    if (s[0] === 'L') d += ` L${pt(s[1], s[2])}`;
    else if (s[0] === 'Q') d += ` Q${pt(s[1], s[2])} ${pt(s[3], s[4])}`;
    else d += ` C${pt(s[1], s[2])} ${pt(s[3], s[4])} ${pt(s[5], s[6])}`;
  }
  d += ` L${b.map(f).join(' ')}`;
  d += ` A${rx} ${ry} ${f((rot * 180) / Math.PI)} ${Math.abs(t2 - t1) > 180 ? 1 : 0} ${t2 > t1 ? 0 : 1} ${a.map(f).join(' ')} Z`;
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

/** Closed band with a wavy top edge. */
function waves(p: Pen, y: number, amp: number, x0 = 60, x1 = 940, bottom = 950, step = 110): void {
  let d = `M${x0} ${y} Q${x0 + step / 2} ${y - amp} ${x0 + step} ${y}`;
  for (let x = x0 + 2 * step; x <= x1 + 1; x += step) d += ` T${x} ${y}`;
  p.path(`${d} L${x1} ${bottom} L${x0} ${bottom} Z`);
}

function bubbles(p: Pen, list: [number, number, number][]): void {
  for (const [x, y, r] of list) p.circle(x, y, r);
}

export const pages: PageDef[] = [
  // 1 clownfish
  page('ocean', 1, (p) => {
    p.ellipse(440, 500, 290, 200); // body
    fin(p, 440, 500, 290, 200, 0, -25, 25, [['L', 490, -170], ['Q', 400, 0, 490, 170]]); // tail
    fin(p, 440, 500, 290, 200, 0, -120, -65, [['C', -90, -290, 120, -300, 150, -170]]); // top fin
    fin(p, 440, 500, 290, 200, 0, 75, 115, [['L', -10, 290]]); // bottom fin
    p.path('M335 308 Q295 500 335 692'); // stripes
    p.path('M545 305 Q585 500 545 695');
    eyes(p, 230, 455, 44);
    p.path('M170 560 Q225 600 280 560'); // smile
    p.ellipse(430, 560, 50, 28, 0.5); // side fin
    bubbles(p, [[110, 330, 38], [75, 235, 26], [140, 150, 18]]);
  }),

  // 2 octopus
  page('ocean', 2, (p) => {
    p.circle(500, 370, 250); // head
    const arms: [number, number, number][] = [
      [13, 39, 250],
      [45, 71, 300],
      [77, 103, 330],
      [109, 135, 300],
      [141, 167, 250],
    ];
    for (const [a1, a2, o] of arms) lobe(p, 500, 370, 250, a1, a2, o, 0);
    eyes(p, 400, 360, 55);
    eyes(p, 600, 360, 55);
    p.path('M420 470 Q500 540 580 470'); // smile
    p.circle(500, 190, 34); // head spots
    p.circle(390, 230, 24);
    p.circle(610, 230, 24);
    p.circle(330, 460, 30); // cheeks
    p.circle(670, 460, 30);
    bubbles(p, [[880, 140, 30], [920, 250, 18]]);
  }),

  // 3 whale with spout
  page('ocean', 3, (p) => {
    p.ellipse(480, 560, 380, 230); // body
    fin(p, 480, 560, 380, 230, 0, 160, 200, [['L', -470, 140], ['L', -430, -5], ['L', -480, -200], ['L', -380, -70]]); // flukes
    fin(p, 480, 560, 380, 230, 0, -55, -35, [['Q', 180, -230, 130, -330], ['Q', 190, -290, 215, -250], ['Q', 260, -310, 330, -320], ['Q', 260, -260, 280, -130]]); // spout
    eyes(p, 700, 500, 34);
    p.path('M620 620 Q750 690 840 600'); // smile
    p.ellipse(430, 690, 90, 38, 0.5); // flipper
    p.path('M240 580 Q400 720 640 700'); // belly line
    p.circle(640, 150, 24);
    p.circle(850, 160, 20);
    waves(p, 880, 30, 60, 940, 960, 110);
  }),

  // 4 crab
  page('ocean', 4, (p) => {
    p.circle(500, 610, 230); // shell
    lobe(p, 500, 610, 230, 200, 250, 170, 14); // claws
    lobe(p, 500, 610, 230, 290, 340, 170, 14);
    p.line(170, 300, 215, 390); // claw notches
    p.line(830, 300, 785, 390);
    for (const [a1, a2] of [[16, 30], [36, 50], [56, 70]]) lobe(p, 500, 610, 230, a1!, a2!, 110, 0); // legs
    for (const [a1, a2] of [[110, 124], [130, 144], [150, 164]]) lobe(p, 500, 610, 230, a1!, a2!, 110, 0);
    p.line(430, 395, 430, 300); // eye stalks
    p.line(570, 395, 570, 300);
    eyes(p, 430, 260, 42);
    eyes(p, 570, 260, 42);
    p.circle(390, 590, 28); // spots
    p.circle(610, 590, 28);
    p.path('M410 680 Q500 760 590 680'); // smile
    p.circle(500, 500, 22);
  }),

  // 5 starfish with shells
  page('ocean', 5, (p) => {
    p.star(500, 450, 340, 150, 5);
    eyes(p, 430, 420, 32);
    eyes(p, 570, 420, 32);
    p.path('M440 500 Q500 560 560 500');
    for (let i = 0; i < 5; i++) {
      const a = rad(-90 + i * 72);
      p.circle(500 + 240 * Math.cos(a), 450 + 240 * Math.sin(a), 24);
    }
    p.path('M160 950 L90 880 A100 100 0 0 1 230 880 Z'); // scallop
    p.line(160, 950, 130, 800);
    p.line(160, 950, 160, 790);
    p.line(160, 950, 190, 800);
    p.circle(830, 860, 90); // snail shell
    p.circle(830, 860, 52);
    p.circle(830, 860, 20);
  }),

  // 6 seahorse
  page('ocean', 6, (p) => {
    // head + belly union written by hand (two circles)
    const [x1, y1, r1, x2, y2, r2] = [500, 220, 115, 480, 500, 190];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    const ux = (x2 - x1) / d;
    const uy = (y2 - y1) / d;
    const A = [x1 + ux * a - uy * h, y1 + uy * a + ux * h];
    const B = [x1 + ux * a + uy * h, y1 + uy * a - ux * h];
    p.path(`M${f(A[0]!)} ${f(A[1]!)} A${r1} ${r1} 0 1 1 ${f(B[0]!)} ${f(B[1]!)} A${r2} ${r2} 0 1 1 ${f(A[0]!)} ${f(A[1]!)} Z`);
    lobe(p, 500, 220, 115, 160, 200, 120, 0); // snout
    lobe(p, 500, 220, 115, -115, -90, 55, 0); // crest
    lobe(p, 500, 220, 115, -85, -60, 55, 0);
    lobe(p, 480, 500, 190, -45, -5, 130, 10); // back fin
    eyes(p, 520, 200, 30);
    p.path('M298 470 Q480 520 662 470'); // belly bands
    p.path('M298 565 Q480 610 662 565');
    p.path('M529 683 C650 740 700 900 600 945 C500 985 430 880 505 840 C520 832 540 845 530 860 C520 880 480 880 470 850 C455 800 470 760 431 683 A190 190 0 0 1 529 683 Z');
    p.circle(320, 340, 24);
    bubbles(p, [[820, 330, 34], [880, 230, 22], [800, 150, 16]]);
  }),

  // 7 jellyfish
  page('ocean', 7, (p) => {
    p.path('M190 470 A310 310 0 0 1 810 470 A62 62 0 0 1 686 470 A62 62 0 0 1 562 470 A62 62 0 0 1 438 470 A62 62 0 0 1 314 470 A62 62 0 0 1 190 470 Z');
    eyes(p, 410, 370, 36);
    eyes(p, 590, 370, 36);
    p.path('M455 440 Q500 480 545 440');
    p.circle(500, 190, 36); // spots
    p.circle(330, 260, 30);
    p.circle(670, 260, 30);
    p.circle(260, 400, 22);
    p.circle(740, 400, 22);
    p.path('M252 532 Q215 640 255 740 T250 940');
    p.path('M376 532 Q340 650 380 760 T376 940');
    p.path('M500 532 Q465 650 505 760 T500 940');
    p.path('M624 532 Q590 650 630 760 T624 940');
    p.path('M748 532 Q715 640 755 740 T750 940');
    bubbles(p, [[110, 200, 26], [880, 150, 30], [900, 300, 18]]);
  }),

  // 8 sea turtle
  page('ocean', 8, (p) => {
    union(p, 500, 570, 240, 500, 250, 90); // shell + head
    lobe(p, 500, 570, 240, 190, 232, 170, 8); // front flippers
    lobe(p, 500, 570, 240, -52, -10, 170, 8);
    lobe(p, 500, 570, 240, 120, 152, 100, 5); // rear flippers
    lobe(p, 500, 570, 240, 28, 60, 100, 5);
    lobe(p, 500, 570, 240, 82, 98, 70, 0); // tail
    p.circle(468, 235, 16);
    p.circle(532, 235, 16);
    p.path('M468 280 Q500 300 532 280');
    const hex: [number, number][] = [];
    for (let i = 0; i < 6; i++) hex.push([500 + 95 * Math.cos(rad(-90 + i * 60)), 570 + 95 * Math.sin(rad(-90 + i * 60))]);
    p.poly(hex);
    for (let i = 0; i < 6; i++) {
      const ang = rad(-90 + i * 60);
      p.line(hex[i]![0], hex[i]![1], 500 + 241 * Math.cos(ang), 570 + 241 * Math.sin(ang));
    }
    p.circle(500, 570, 40);
  }),

  // 9 leaping dolphin
  page('ocean', 9, (p) => {
    p.path(
      'M890 310 C860 290 830 300 800 270 C760 220 680 230 620 290 C590 320 560 345 535 372 Q540 290 470 250 Q470 340 430 410 C380 470 340 540 300 600 C270 630 255 640 240 650 L120 590 L190 665 L200 770 L255 690 C300 675 330 645 360 620 L350 735 Q410 665 440 590 C520 540 600 460 690 410 C740 385 790 370 840 355 Q885 345 890 310 Z',
    );
    p.circle(785, 305, 20); // eye
    p.path('M885 335 Q820 355 755 335'); // smile
    p.path('M600 400 Q520 500 430 570'); // belly line
    p.circle(620, 340, 14);
    waves(p, 830, 40, 60, 940, 960, 110);
    bubbles(p, [[150, 450, 28], [110, 340, 18], [860, 640, 30], [920, 540, 18], [700, 700, 20]]);
  }),

  // 10 friendly shark
  page('ocean', 10, (p) => {
    const [cx, cy, rx, ry] = [520, 540, 360, 180];
    p.ellipse(cx, cy, rx, ry);
    fin(p, cx, cy, rx, ry, 0, 160, 200, [['L', -430, 55], ['L', -500, 210], ['L', -465, 5], ['L', -520, -230], ['L', -430, -55]]); // tail
    fin(p, cx, cy, rx, ry, 0, -110, -55, [['L', -20, -330], ['L', 50, -250]]); // dorsal
    fin(p, cx, cy, rx, ry, 0, 70, 110, [['L', -60, 290]]); // pectoral
    eyes(p, 700, 480, 32);
    p.path('M590 590 Q700 660 830 590'); // mouth
    p.poly([[640, 610], [680, 610], [660, 645]]); // teeth
    p.poly([[720, 625], [760, 618], [742, 655]]);
    p.path('M400 480 Q430 540 400 600');
    p.path('M450 480 Q480 540 450 600');
    p.path('M500 480 Q530 540 500 600');
    bubbles(p, [[90, 170, 34], [150, 90, 22], [880, 250, 28], [920, 160, 18]]);
    waves(p, 880, 30, 60, 940, 960, 110);
  }),

  // 11 pufferfish
  page('ocean', 11, (p) => {
    p.star(500, 500, 400, 300, 18);
    eyes(p, 380, 400, 62);
    eyes(p, 620, 400, 62);
    p.circle(500, 560, 52); // lips
    p.circle(500, 560, 22);
    p.ellipse(215, 540, 60, 36, 0.4); // fins
    p.ellipse(785, 540, 60, 36, -0.4);
    p.circle(380, 250, 28); // spots
    p.circle(500, 220, 28);
    p.circle(620, 250, 28);
    p.circle(380, 700, 28);
    p.circle(620, 700, 28);
    p.path('M420 780 Q500 830 580 780');
  }),

  // 12 sailboat on waves
  page('ocean', 12, (p) => {
    p.path('M240 590 L760 590 L680 710 Q500 740 320 710 Z'); // hull
    p.line(500, 150, 500, 590); // mast
    p.poly([[515, 190], [515, 560], [740, 560]]); // main sail
    p.poly([[485, 260], [485, 560], [300, 560]]); // jib
    p.poly([[500, 150], [590, 180], [500, 210]]); // flag
    p.circle(390, 650, 22);
    p.circle(500, 660, 22);
    p.circle(610, 650, 22);
    p.path('M560 480 L670 540');
    sun(p, 160, 190, 70);
    cloud(p, 660, 170, 300);
    waves(p, 700, 36, 60, 940, 950, 110);
    waves(p, 810, 36, 60, 940, 950, 110);
  }),

  // 13 treasure chest
  page('ocean', 13, (p) => {
    p.rect(60, 820, 880, 130); // sand
    p.roundRect(200, 540, 600, 280, 24); // base
    p.path('M200 540 L200 450 Q200 300 350 300 L650 300 Q800 300 800 450 L800 540 Z'); // lid
    p.line(330, 305, 330, 820);
    p.line(670, 305, 670, 820);
    p.circle(500, 540, 54); // lock
    p.circle(500, 530, 16);
    p.path('M500 540 L500 575');
    p.circle(150, 890, 32); // buried coins
    p.circle(850, 890, 32);
    p.circle(250, 905, 20);
    p.circle(750, 905, 20);
    p.path('M100 820 Q40 700 100 600 Q160 700 100 820 Z'); // seaweed
    p.path('M900 820 Q840 700 900 600 Q960 700 900 820 Z');
    p.star(130, 380, 55, 24, 5);
    p.star(870, 360, 50, 22, 5);
    p.star(500, 150, 60, 26, 5);
    bubbles(p, [[300, 160, 24], [720, 140, 26], [800, 240, 16]]);
  }),

  // 14 lighthouse
  page('ocean', 14, (p) => {
    p.poly([[380, 880], [620, 880], [570, 340], [430, 340]]); // tower
    p.line(398, 750, 602, 750);
    p.line(412, 620, 588, 620);
    p.line(424, 490, 576, 490);
    p.roundRect(400, 300, 200, 40, 10); // gallery
    p.roundRect(440, 200, 120, 100, 10); // lantern
    p.circle(500, 250, 26);
    p.poly([[420, 200], [500, 110], [580, 200]]); // roof
    p.poly([[440, 250], [110, 160], [110, 340]]); // light beams
    p.poly([[560, 250], [890, 160], [890, 340]]);
    p.path('M470 880 L470 800 Q500 760 530 800 L530 880 Z'); // door
    p.circle(500, 685, 24);
    p.circle(500, 555, 24);
    p.path('M100 900 Q250 830 380 880 L620 880 Q750 830 900 900 L900 960 L100 960 Z'); // rock
    p.path('M130 480 Q160 440 190 480 Q220 440 250 480'); // gulls
    p.path('M760 460 Q790 420 820 460 Q850 420 880 460');
    p.path('M160 930 Q200 910 240 930');
    p.path('M760 930 Q800 910 840 930');
  }),

  // 15 coral reef with fish
  page('ocean', 15, (p) => {
    p.path('M60 960 L60 850 Q250 780 500 850 Q750 780 940 850 L940 960 Z'); // sand
    p.path('M440 880 L440 600 Q440 540 400 500 Q370 420 430 410 Q480 410 470 500 L500 560 L530 480 Q530 400 590 410 Q640 430 610 500 Q570 540 560 600 L560 880 Z'); // branch coral
    p.circle(200, 780, 110); // brain coral
    p.path('M130 740 Q170 700 210 740 T290 740');
    p.path('M120 810 Q165 770 210 810 T300 810');
    p.path('M780 880 Q720 750 790 640 Q850 750 780 880 Z'); // seaweed
    p.path('M860 880 Q820 780 880 700 Q930 790 860 880 Z');
    // fish A
    p.ellipse(700, 280, 100, 62);
    fin(p, 700, 280, 100, 62, 0, -25, 25, [['L', 160, -55], ['Q', 135, 0, 160, 55]]);
    p.circle(650, 265, 16);
    // fish B
    p.ellipse(260, 330, 90, 56);
    fin(p, 260, 330, 90, 56, 0, 155, 205, [['L', -150, 50], ['Q', -125, 0, -150, -50]]);
    p.circle(305, 315, 14);
    bubbles(p, [[880, 180, 26], [800, 110, 18], [140, 170, 24], [200, 100, 16]]);
  }),
];
