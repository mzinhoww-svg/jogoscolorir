// Animals — 15 distinct subjects:
// 1 cat face, 2 puppy face, 3 elephant, 4 giraffe, 5 lion, 6 bunny with carrot, 7 owl on a branch,
// 8 pig, 9 cow, 10 monkey with banana, 11 panda with bamboo, 12 duck on a pond (sun + cloud),
// 13 butterfly, 14 sheep on grass, 15 hen with chick and egg.
import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => Math.round(n * 10) / 10;

/** Closed bump (ear, leg, horn...) attached to a circle between angles a1<a2 (degrees, y down). */
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
  page('animals', 1, (p) => {
    p.poly([
      [220, 450],
      [240, 130],
      [440, 310],
    ]); // left ear
    p.poly([
      [780, 450],
      [760, 130],
      [560, 310],
    ]); // right ear
    p.poly([
      [270, 390],
      [275, 240],
      [380, 330],
    ]); // inner ears
    p.poly([
      [730, 390],
      [725, 240],
      [620, 330],
    ]);
    p.ellipse(500, 580, 310, 270); // head
    p.circle(390, 520, 62); // eyes
    p.circle(610, 520, 62);
    p.circle(400, 530, 26); // pupils (holes)
    p.circle(600, 530, 26);
    p.poly([
      [460, 610],
      [540, 610],
      [500, 660],
    ]); // nose
    p.path('M500 660 L500 700 M500 700 Q450 760 400 715 M500 700 Q550 760 600 715');
    p.circle(300, 650, 40); // cheeks
    p.circle(700, 650, 40);
    p.line(120, 600, 230, 625); // whiskers
    p.line(110, 680, 225, 670);
    p.line(880, 600, 770, 625);
    p.line(890, 680, 775, 670);
    p.path('M500 310 L500 380 M440 325 L455 385 M560 325 L545 385'); // forehead stripes
  }),

  // 2 puppy face with floppy ears
  page('animals', 2, (p) => {
    p.circle(500, 520, 270); // head
    p.path('M290 340 C120 330 100 560 170 700 C230 760 300 650 290 340 Z'); // left ear
    p.path('M710 340 C880 330 900 560 830 700 C770 760 700 650 710 340 Z'); // right ear
    p.ellipse(500, 650, 160, 115); // muzzle
    p.ellipse(500, 590, 62, 42); // nose
    p.path('M500 632 L500 690 M500 690 Q450 745 400 700 M500 690 Q550 745 600 700');
    p.path('M455 735 Q455 830 500 830 Q545 830 545 735 Z'); // tongue
    eyes(p, 390, 440, 48);
    eyes(p, 610, 440, 48);
    p.circle(560, 300, 52); // head spot
    p.line(330, 330, 380, 365); // brows
    p.line(670, 330, 620, 365);
  }),

  // 3 elephant
  page('animals', 3, (p) => {
    p.circle(500, 470, 230); // head
    lobe(p, 500, 470, 230, 138, 222, 170, 10); // left ear
    lobe(p, 500, 470, 230, -42, 42, 170, 10); // right ear
    p.circle(165, 470, 48);
    p.circle(835, 470, 48);
    p.path('M425 540 C425 700 420 800 480 880 C520 935 625 925 640 860 C650 815 605 800 590 830 C578 852 548 850 543 820 C535 760 575 700 575 540 Z'); // trunk
    p.path('M450 640 L550 640 M455 710 L548 710'); // wrinkles
    eyes(p, 410, 410, 40);
    eyes(p, 590, 410, 40);
    p.ellipse(380, 580, 22, 55, 0.35); // tusks
    p.ellipse(620, 580, 22, 55, -0.35);
  }),

  // 4 giraffe
  page('animals', 4, (p) => {
    p.path('M410 340 L350 770 Q300 830 250 900 Q250 960 330 960 L670 960 Q750 960 750 900 Q700 830 650 770 L590 340 Z'); // neck + shoulders
    p.ellipse(500, 230, 150, 135); // head
    p.ellipse(500, 300, 100, 66); // muzzle
    p.circle(468, 310, 12);
    p.circle(532, 310, 12);
    p.ellipse(335, 200, 70, 32, -0.5); // ears
    p.ellipse(665, 200, 70, 32, 0.5);
    p.ellipse(430, 78, 22, 50, -0.2); // horns
    p.ellipse(570, 78, 22, 50, 0.2);
    eyes(p, 440, 210, 34);
    eyes(p, 560, 210, 34);
    p.path('M470 345 Q500 365 530 345');
    p.ellipse(470, 480, 52, 40, 0.3); // spots
    p.ellipse(565, 590, 46, 42, -0.3);
    p.ellipse(450, 690, 52, 38, 0.2);
    p.ellipse(580, 800, 58, 44, -0.2);
    p.ellipse(420, 860, 46, 36, 0.4);
    p.ellipse(670, 905, 36, 28, 0);
    p.ellipse(330, 905, 36, 28, 0);
  }),

  // 5 lion
  page('animals', 5, (p) => {
    const n = 14;
    const R = 372;
    const pt = (i: number) => [500 + R * Math.cos((i * 2 * Math.PI) / n), 520 + R * Math.sin((i * 2 * Math.PI) / n)];
    const chord = 2 * R * Math.sin(Math.PI / n);
    const r = f(chord * 0.6);
    let d = `M${f(pt(0)[0]!)} ${f(pt(0)[1]!)}`;
    for (let i = 1; i <= n; i++) d += ` A${r} ${r} 0 0 1 ${f(pt(i % n)[0]!)} ${f(pt(i % n)[1]!)}`;
    p.path(d + ' Z'); // mane
    p.circle(500, 520, 235); // face
    lobe(p, 500, 520, 235, -140, -112, 55, 10);
    lobe(p, 500, 520, 235, -68, -40, 55, 10);
    eyes(p, 410, 470, 38);
    eyes(p, 590, 470, 38);
    p.ellipse(500, 620, 110, 80); // muzzle
    p.poly([
      [455, 575],
      [545, 575],
      [500, 625],
    ]);
    p.path('M500 625 L500 655 M500 655 Q465 695 425 665 M500 655 Q535 695 575 665');
    p.line(350, 600, 290, 590); // whiskers
    p.line(650, 600, 710, 590);
  }),

  // 6 bunny with carrot
  page('animals', 6, (p) => {
    p.circle(450, 580, 200); // head
    lobe(p, 450, 580, 200, -122, -92, 330, 0); // left ear
    lobe(p, 450, 580, 200, -88, -58, 330, 0); // right ear
    lobe(p, 450, 580, 200, -112, -102, 215, 0); // inner ears
    lobe(p, 450, 580, 200, -78, -68, 215, 0);
    eyes(p, 370, 560, 40);
    eyes(p, 530, 560, 40);
    p.ellipse(450, 640, 34, 24); // nose
    p.path('M450 664 L450 695 M450 695 Q420 730 385 705 M450 695 Q480 730 515 705');
    p.circle(280, 650, 34);
    p.circle(620, 650, 34);
    p.poly([
      [640, 800],
      [650, 930],
      [940, 870],
    ]); // carrot
    p.ellipse(610, 825, 48, 22, -0.5); // leaves
    p.ellipse(612, 905, 48, 22, 0.5);
    p.line(720, 855, 720, 895);
    p.line(810, 850, 810, 880);
  }),

  // 7 owl on a branch
  page('animals', 7, (p) => {
    p.ellipse(500, 520, 290, 360); // body
    p.poly([
      [260, 280],
      [240, 110],
      [400, 190],
    ]); // ear tufts
    p.poly([
      [740, 280],
      [760, 110],
      [600, 190],
    ]);
    p.circle(375, 400, 100); // eye discs
    p.circle(625, 400, 100);
    p.circle(375, 400, 52);
    p.circle(625, 400, 52);
    p.circle(375, 400, 22);
    p.circle(625, 400, 22);
    p.poly([
      [500, 450],
      [450, 520],
      [500, 580],
      [550, 520],
    ]); // beak
    p.ellipse(500, 710, 160, 130); // belly
    p.path('M440 680 Q470 710 500 680 Q530 710 560 680');
    p.path('M410 750 Q440 780 470 750 Q500 780 530 750 Q560 780 590 750');
    p.ellipse(255, 600, 50, 170, 0.12); // wings
    p.ellipse(745, 600, 50, 170, -0.12);
    p.roundRect(100, 850, 800, 90, 40); // branch
    p.line(300, 880, 360, 880);
    p.line(640, 910, 720, 910);
  }),

  // 8 pig
  page('animals', 8, (p) => {
    p.circle(500, 520, 300); // head
    lobe(p, 500, 520, 300, -145, -95, 100, 12); // ears
    lobe(p, 500, 520, 300, -85, -35, 100, 12);
    p.ellipse(500, 590, 150, 110); // snout
    p.ellipse(450, 590, 24, 38); // nostrils
    p.ellipse(550, 590, 24, 38);
    eyes(p, 360, 440, 42);
    eyes(p, 640, 440, 42);
    p.circle(280, 600, 46); // cheeks
    p.circle(720, 600, 46);
    p.path('M420 735 Q500 800 580 735');
    p.path('M470 360 Q500 330 530 360');
  }),

  // 9 cow
  page('animals', 9, (p) => {
    p.circle(500, 410, 230); // head
    lobe(p, 500, 410, 230, -128, -108, 120, 0); // horns
    lobe(p, 500, 410, 230, -72, -52, 120, 0);
    lobe(p, 500, 410, 230, 160, 205, 170, 0); // ears
    lobe(p, 500, 410, 230, -25, 20, 170, 0);
    p.circle(130, 420, 30); // inner ears
    p.circle(870, 400, 30);
    p.ellipse(360, 400, 95, 80, -0.3); // black patches
    p.path('M560 230 Q640 210 675 290 Q655 360 590 335 Q540 290 560 230 Z');
    eyes(p, 370, 400, 32);
    eyes(p, 630, 420, 32);
    p.ellipse(500, 630, 190, 125); // muzzle
    p.ellipse(430, 640, 20, 28); // nostrils
    p.ellipse(570, 640, 20, 28);
    p.path('M430 710 Q500 755 570 710');
    p.path('M320 785 Q500 850 680 785 L690 835 Q500 905 310 835 Z'); // collar
    p.circle(500, 925, 32); // bell
  }),

  // 10 monkey with banana
  page('animals', 10, (p) => {
    p.circle(450, 470, 250); // head
    lobe(p, 450, 470, 250, 140, 220, 110, 0); // ears
    lobe(p, 450, 470, 250, -40, 40, 110, 0);
    p.circle(165, 470, 50);
    p.circle(735, 470, 50);
    p.ellipse(450, 540, 195, 160); // face mask
    eyes(p, 375, 490, 34);
    eyes(p, 525, 490, 34);
    p.circle(420, 580, 13); // nostrils
    p.circle(480, 580, 13);
    p.path('M360 630 Q450 710 540 630');
    p.path('M660 760 Q790 690 940 790 Q890 960 720 960 Q870 870 660 760 Z'); // banana
    p.line(715, 800, 800, 850);
  }),

  // 11 panda with bamboo
  page('animals', 11, (p) => {
    p.circle(440, 520, 290); // head
    lobe(p, 440, 520, 290, -150, -112, 100, 10); // ears
    lobe(p, 440, 520, 290, -68, -30, 100, 10);
    p.ellipse(320, 490, 75, 100, 0.5); // eye patches
    p.ellipse(560, 490, 75, 100, -0.5);
    eyes(p, 335, 495, 36);
    eyes(p, 545, 495, 36);
    p.ellipse(440, 600, 48, 34); // nose
    p.path('M440 634 L440 665 M440 665 Q405 715 365 680 M440 665 Q475 715 515 680');
    p.roundRect(810, 200, 80, 750, 20); // bamboo
    p.line(810, 400, 890, 400);
    p.line(810, 620, 890, 620);
    p.line(810, 820, 890, 820);
    p.ellipse(760, 280, 70, 24, -0.6); // leaves
    p.ellipse(930, 330, 55, 22, 0.6);
  }),

  // 12 duck on a pond
  page('animals', 12, (p) => {
    union(p, 450, 600, 200, 590, 370, 110); // body + head
    lobe(p, 450, 600, 200, 195, 235, 120, 8); // tail
    lobe(p, 590, 370, 110, -20, 22, 90, 5); // beak
    p.circle(595, 345, 26); // eye
    p.ellipse(430, 600, 105, 70, -0.25); // wing
    p.path('M60 855 Q150 805 240 855 T420 855 T600 855 T780 855 T950 855 L950 960 L60 960 Z'); // pond
    p.path('M240 905 Q300 925 360 905');
    p.path('M600 905 Q660 925 720 905');
    sun(p, 830, 150, 70);
    cloud(p, 70, 230, 380);
  }),

  // 13 butterfly
  page('animals', 13, (p) => {
    const side = (s: number) => {
      const x = (v: number) => 500 + s * (v - 500);
      p.path(
        `M${x(450)} 470 C${x(380)} 300 ${x(250)} 130 ${x(130)} 190 C${x(60)} 240 ${x(80)} 400 ${x(190)} 470 C${x(260)} 510 ${x(390)} 520 ${x(450)} 470 Z`,
      ); // upper wing
      p.path(
        `M${x(450)} 560 C${x(380)} 540 ${x(250)} 560 ${x(210)} 650 C${x(180)} 760 ${x(260)} 840 ${x(330)} 800 C${x(400)} 760 ${x(440)} 660 ${x(450)} 560 Z`,
      ); // lower wing
      p.circle(x(230), 330, 55);
      p.circle(x(230), 330, 24);
      p.circle(x(310), 690, 40);
      p.path(`M${x(470)} 255 Q${x(440)} 170 ${x(390)} 130`);
      p.circle(x(375), 112, 22);
    };
    side(1);
    side(-1);
    p.ellipse(500, 295, 46, 46); // head
    p.ellipse(500, 540, 34, 175); // body
    p.line(500, 400, 500, 440);
  }),

  // 14 sheep on grass
  page('animals', 14, (p) => {
    union(p, 580, 470, 240, 290, 570, 100); // body + head
    lobe(p, 580, 470, 240, 62, 80, 120, 0); // legs
    lobe(p, 580, 470, 240, 98, 116, 120, 0);
    lobe(p, 290, 570, 100, 195, 235, 80, 8); // ear
    p.circle(262, 545, 22); // eye
    p.ellipse(255, 625, 38, 24); // nose
    p.circle(500, 340, 55); // wool curls
    p.circle(630, 330, 55);
    p.circle(740, 430, 55);
    p.circle(540, 470, 55);
    p.circle(670, 540, 55);
    p.path('M60 915 Q200 885 340 915 T620 915 T900 915'); // ground
    p.path('M120 960 L140 925 L160 960 M840 960 L860 925 L880 960');
  }),

  // 15 hen with chick and egg
  page('animals', 15, (p) => {
    union(p, 430, 540, 230, 600, 320, 100); // body + head
    lobe(p, 600, 320, 100, -112, -88, 60, 4); // comb
    lobe(p, 600, 320, 100, -88, -64, 60, 4);
    lobe(p, 600, 320, 100, -136, -112, 60, 4);
    lobe(p, 600, 320, 100, -12, 14, 75, 0); // beak
    lobe(p, 600, 320, 100, 42, 62, 55, 0); // wattle
    p.circle(618, 300, 20); // eye
    lobe(p, 430, 540, 230, 180, 205, 120, 10); // tail feathers
    lobe(p, 430, 540, 230, 205, 230, 120, 10);
    p.ellipse(410, 550, 120, 80, -0.3); // wing
    p.path('M390 770 L390 870 M390 870 L350 900 M390 870 L430 900 M390 870 L390 905');
    p.path('M520 765 L520 870 M520 870 L480 900 M520 870 L560 900 M520 870 L520 905');
    p.circle(800, 760, 85); // chick
    lobe(p, 800, 760, 85, -10, 20, 60, 0);
    p.circle(815, 735, 15);
    p.ellipse(150, 830, 62, 80); // egg
    p.path('M60 945 Q250 925 440 945 T820 945 T960 945');
  }),
];
