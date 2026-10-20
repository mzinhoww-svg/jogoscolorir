import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

/*
 * Princess theme — 15 distinct subjects:
 *  1 princess portrait   2 crown          3 princess in a gown   4 royal carriage    5 magic wand
 *  6 throne              7 pony princess  8 hand mirror          9 treasure chest   10 royal dress
 * 11 frog with crown    12 royal cupcake 13 jewel ring          14 swan with crown 15 royal teapot
 */

const ey = (cx: number, cy: number, rx: number, ry: number, x: number, sign: 1 | -1) =>
  cy + sign * ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
const ex = (cx: number, cy: number, rx: number, ry: number, y: number, sign: 1 | -1) =>
  cx + sign * rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));

const star4 = (p: Pen, x: number, y: number, r: number) => p.star(x, y, r, r * 0.38, 4);
const smile = (p: Pen, x: number, y: number, w: number, d: number) =>
  p.path(`M${x - w} ${y} Q${x} ${y + d} ${x + w} ${y}`);

/** Small crown with its base centred on (x, y). */
const crown = (p: Pen, x: number, y: number, w: number, h: number) => {
  const l = x - w / 2;
  const r = x + w / 2;
  p.poly([
    [l, y],
    [l - w * 0.04, y - h],
    [l + w * 0.27, y - h * 0.55],
    [x, y - h * 1.15],
    [r - w * 0.27, y - h * 0.55],
    [r + w * 0.04, y - h],
    [r, y],
  ]);
};

const bar = (p: Pen, x1: number, y1: number, x2: number, y2: number, w1: number, w2 = w1) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  p.poly([
    [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2],
    [x2 + (nx * w2) / 2, y2 + (ny * w2) / 2],
    [x2 - (nx * w2) / 2, y2 - (ny * w2) / 2],
    [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2],
  ]);
};

export const pages: PageDef[] = [
  // 1 — Princess portrait
  page('princess', 1, (p) => {
    const C = [500, 520, 215, 245] as const;
    const at = (deg: number): [number, number] => [
      C[0] + C[2] * Math.cos((deg * Math.PI) / 180),
      C[1] + C[3] * Math.sin((deg * Math.PI) / 180),
    ];
    p.ellipse(...C); // face
    const tl = at(-160);
    const tr = at(-20);
    p.path(`M${tl[0]} ${tl[1]} C230 80 770 80 ${tr[0]} ${tr[1]}`); // hair on top
    p.path(`M${tl[0]} ${tl[1]} Q420 320 500 385 Q580 320 ${tr[0]} ${tr[1]}`); // fringe
    const x1 = ey(500, 520, 215, 245, 400, 1);
    p.path(`M400 ${x1} Q300 760 220 820 L180 960 L820 960 L780 820 Q700 760 600 ${x1}`); // shoulders
    p.path(`M400 ${x1} Q500 830 600 ${x1}`); // neckline
    const a = at(175);
    const b = at(140);
    p.path(`M${a[0]} ${a[1]} C160 520 120 720 150 870 Q190 930 260 860 Q330 780 ${b[0]} ${b[1]}`); // locks
    p.path(`M${1000 - a[0]} ${a[1]} C840 520 880 720 850 870 Q810 930 740 860 Q670 780 ${1000 - b[0]} ${b[1]}`);
    crown(p, 500, 200, 210, 90);
    p.circle(500, 172, 16);
    p.circle(440, 180, 12);
    p.circle(560, 180, 12);
    p.ellipse(410, 515, 32, 40);
    p.ellipse(590, 515, 32, 40);
    p.circle(416, 525, 14);
    p.circle(584, 525, 14);
    p.path('M385 460 Q410 440 435 460');
    p.path('M565 460 Q590 440 615 460');
    p.path('M485 585 Q500 600 515 585');
    smile(p, 500, 645, 60, 48);
    p.circle(350, 600, 28);
    p.circle(650, 600, 28);
    p.circle(500, 880, 28);
    star4(p, 90, 130, 45);
    star4(p, 910, 130, 45);
  }),
  // 2 — Crown
  page('princess', 2, (p) => {
    p.path('M200 600 L170 340 L340 490 L500 280 L660 490 L830 340 L800 600 Z');
    p.roundRect(190, 600, 620, 150, 30); // band
    p.circle(170, 320, 38);
    p.circle(500, 255, 42);
    p.circle(830, 320, 38);
    p.heart(500, 470, 110);
    p.circle(300, 675, 32); // jewels
    p.circle(500, 675, 36);
    p.circle(700, 675, 32);
    star4(p, 110, 840, 55);
    star4(p, 890, 840, 55);
    star4(p, 500, 880, 40);
  }),
  // 3 — Princess in a gown
  page('princess', 3, (p) => {
    p.circle(500, 200, 100); // head
    p.circle(385, 140, 48); // buns
    p.circle(615, 140, 48);
    crown(p, 500, 125, 80, 50);
    const xl = 450;
    const xr = 550;
    const yb = ey(500, 200, 100, 100, xl, 1);
    p.path(`M${xl} ${yb} Q400 300 380 340 L400 470 L600 470 L620 340 Q600 300 ${xr} ${yb}`); // bodice
    p.path(
      'M400 470 Q250 700 170 880 Q330 950 500 900 Q670 950 830 880 Q750 700 600 470 Z',
    ); // skirt
    p.line(402, 440, 598, 440);
    p.circle(385, 350, 42); // sleeves
    p.circle(615, 350, 42);
    p.ellipse(340, 480, 34, 95, 0.35); // arms
    p.ellipse(660, 480, 34, 95, -0.35);
    p.path('M470 470 Q440 700 350 910'); // folds
    p.path('M530 470 Q560 700 650 910');
    p.heart(500, 540, 70);
    p.circle(465, 205, 14);
    p.circle(535, 205, 14);
    smile(p, 500, 245, 30, 22);
    star4(p, 100, 300, 45);
    star4(p, 900, 300, 45);
  }),
  // 4 — Royal carriage
  page('princess', 4, (p) => {
    p.path('M220 570 Q200 300 500 175 Q800 300 780 570 Z'); // cabin
    p.ellipse(500, 400, 85, 105); // window
    p.path('M500 180 Q330 330 330 570');
    p.path('M500 180 Q670 330 670 570');
    p.heart(500, 105, 70);
    p.roundRect(170, 570, 660, 80, 24); // base
    for (const x of [270, 730]) {
      p.circle(x, 740, 120);
      p.circle(x, 740, 40);
      p.line(x - 120, 740, x + 120, 740);
      p.line(x, 620, x, 860);
    }
    star4(p, 100, 150, 45);
    star4(p, 900, 150, 45);
  }),
  // 5 — Magic wand
  page('princess', 5, (p) => {
    p.star(650, 300, 230, 105, 5);
    p.circle(615, 290, 20); // eyes
    p.circle(685, 290, 20);
    smile(p, 650, 335, 36, 28);
    const tip: [number, number] = [
      650 + 230 * Math.cos((126 * Math.PI) / 180),
      300 + 230 * Math.sin((126 * Math.PI) / 180),
    ];
    bar(p, tip[0] - 14, tip[1] + 14, 190, 830, 44, 72);
    p.circle(330, 690, 20); // wand jewels
    p.circle(255, 760, 20);
    star4(p, 120, 200, 55);
    star4(p, 880, 640, 55);
    p.circle(880, 880, 26);
    p.circle(380, 150, 22);
  }),
  // 6 — Throne
  page('princess', 6, (p) => {
    p.path('M300 700 L300 250 Q300 100 500 100 Q700 100 700 250 L700 700 Z'); // back
    p.path('M365 650 L365 280 Q365 175 500 175 Q635 175 635 280 L635 650 Z'); // cushion
    p.heart(500, 400, 170);
    p.roundRect(250, 640, 500, 110, 30); // seat
    p.roundRect(170, 500, 130, 230, 40); // arms
    p.roundRect(700, 500, 130, 230, 40);
    p.circle(235, 560, 26);
    p.circle(765, 560, 26);
    p.rect(270, 750, 70, 140); // legs
    p.rect(660, 750, 70, 140);
    p.roundRect(240, 880, 130, 50, 20);
    p.roundRect(630, 880, 130, 50, 20);
    crown(p, 500, 88, 110, 44);
    star4(p, 100, 160, 45);
    star4(p, 900, 160, 45);
  }),
  // 7 — Pony princess
  page('princess', 7, (p) => {
    p.ellipse(500, 590, 190, 270); // head
    p.path('M345 424 L330 200 L440 324'); // ears
    p.path('M655 424 L670 200 L560 324');
    p.poly([
      [372, 370],
      [362, 280],
      [418, 335],
    ]);
    p.poly([
      [628, 370],
      [638, 280],
      [582, 335],
    ]);
    p.path('M450 320 Q420 450 500 480 Q580 450 550 320'); // fringe
    p.ellipse(500, 780, 130, 95); // muzzle
    p.circle(450, 785, 20); // nostrils
    p.circle(550, 785, 20);
    p.circle(415, 560, 38); // eyes
    p.circle(585, 560, 38);
    p.circle(422, 566, 16);
    p.circle(578, 566, 16);
    smile(p, 500, 845, 40, 24);
    crown(p, 500, 350, 100, 60);
    p.circle(330, 650, 28);
    p.circle(670, 650, 28);
    star4(p, 110, 120, 50);
    star4(p, 890, 120, 50);
  }),
  // 8 — Hand mirror
  page('princess', 8, (p) => {
    p.ellipse(500, 330, 240, 280); // frame
    p.ellipse(500, 330, 175, 215); // glass
    p.path(`M468 ${ey(500, 330, 240, 280, 468, 1)} L458 760 Q405 780 405 835 Q405 905 500 905 Q595 905 595 835 Q595 780 542 760 L532 ${ey(500, 330, 240, 280, 532, 1)}`); // handle
    p.heart(500, 835, 70);
    for (const [x, y] of [
      [500, 80],
      [340, 130],
      [660, 130],
      [260, 330],
      [740, 330],
      [340, 530],
      [660, 530],
    ] as [number, number][]) {
      p.circle(x, y, 17);
    }
    p.path('M400 250 L450 200'); // sparkle in glass
    p.path('M420 300 L480 230');
    star4(p, 110, 800, 50);
    star4(p, 890, 800, 50);
  }),
  // 9 — Treasure chest
  page('princess', 9, (p) => {
    p.path('M170 440 Q170 240 500 240 Q830 240 830 440 Z'); // lid
    p.roundRect(170, 440, 660, 360, 22); // body
    p.rect(450, 400, 100, 130); // lock
    p.circle(500, 440, 22);
    p.roundRect(260, 440, 60, 360, 10);
    p.roundRect(680, 440, 60, 360, 10);
    p.poly([
      [500, 220],
      [440, 150],
      [470, 90],
      [530, 90],
      [560, 150],
    ]); // gem
    p.poly([
      [260, 190],
      [300, 120],
      [340, 190],
      [300, 230],
    ]);
    p.poly([
      [700, 190],
      [740, 120],
      [780, 190],
      [740, 230],
    ]);
    p.circle(500, 680, 36);
    star4(p, 90, 130, 45);
    star4(p, 910, 130, 45);
    p.circle(100, 880, 24);
    p.circle(900, 880, 24);
  }),
  // 10 — Royal dress
  page('princess', 10, (p) => {
    p.path('M500 190 L250 310 L750 310 Z'); // hanger
    p.path('M500 190 Q500 130 540 130 Q585 130 585 90 Q585 55 545 55');
    p.poly([
      [380, 310],
      [620, 310],
      [600, 500],
      [400, 500],
    ]); // bodice
    p.circle(345, 365, 62); // puffed sleeves
    p.circle(655, 365, 62);
    p.path('M400 500 Q250 700 140 900 Q320 960 500 910 Q680 960 860 900 Q750 700 600 500 Z'); // skirt
    p.ellipse(430, 520, 70, 36, 0.25); // bow
    p.ellipse(570, 520, 70, 36, -0.25);
    p.circle(500, 525, 28);
    p.heart(500, 700, 80);
    p.heart(350, 780, 50);
    p.heart(650, 780, 50);
    p.path('M455 560 Q430 700 360 890');
    p.path('M545 560 Q570 700 640 890');
    star4(p, 110, 300, 50);
    star4(p, 890, 300, 50);
  }),
  // 11 — Frog with a crown
  page('princess', 11, (p) => {
    const C = [500, 430, 290, 175] as const;
    p.ellipse(...C);
    p.circle(330, 290, 85);
    p.circle(670, 290, 85);
    p.circle(340, 295, 34);
    p.circle(660, 295, 34);
    const xl = 370;
    const xr = 630;
    p.path(
      `M${xl} ${ey(...C, xl, 1)} Q235 650 240 780 Q250 920 500 920 Q750 920 760 780 Q765 650 ${xr} ${ey(...C, xr, 1)}`,
    ); // body
    p.ellipse(500, 770, 135, 110); // belly
    p.ellipse(330, 905, 80, 38); // feet
    p.ellipse(670, 905, 80, 38);
    smile(p, 500, 470, 150, 90);
    p.circle(450, 410, 14);
    p.circle(550, 410, 14);
    p.circle(340, 480, 30);
    p.circle(660, 480, 30);
    crown(p, 500, 270, 100, 80);
  }),
  // 12 — Royal cupcake
  page('princess', 12, (p) => {
    p.poly([
      [260, 520],
      [740, 520],
      [670, 870],
      [330, 870],
    ]); // wrapper
    for (const [a, b] of [
      [350, 340],
      [430, 395],
      [500, 500],
    ] as [number, number][]) {
      void a;
      void b;
    }
    p.line(350, 520, 385, 870);
    p.line(430, 520, 445, 870);
    p.line(500, 520, 500, 870);
    p.line(570, 520, 555, 870);
    p.line(650, 520, 615, 870);
    p.ellipse(500, 490, 280, 85); // frosting layers
    p.ellipse(500, 385, 205, 75);
    p.ellipse(500, 290, 130, 62);
    crown(p, 500, 250, 120, 70);
    p.heart(360, 495, 50);
    p.heart(640, 495, 50);
    star4(p, 110, 160, 50);
    star4(p, 890, 160, 50);
    p.circle(130, 700, 24);
    p.circle(870, 700, 24);
  }),
  // 13 — Jewel ring
  page('princess', 13, (p) => {
    p.ellipse(500, 735, 235, 205); // band outer
    p.ellipse(500, 735, 165, 140); // band inner
    p.poly([
      [380, 190],
      [620, 190],
      [730, 320],
      [500, 530],
      [270, 320],
    ]); // gem
    p.line(270, 320, 730, 320);
    p.line(380, 190, 430, 320);
    p.line(620, 190, 570, 320);
    p.line(500, 190, 430, 320);
    p.line(500, 190, 570, 320);
    p.line(430, 320, 500, 530);
    p.line(570, 320, 500, 530);
    star4(p, 110, 150, 55);
    star4(p, 890, 150, 55);
    star4(p, 880, 560, 40);
    p.circle(110, 520, 24);
  }),
  // 14 — Swan with a crown
  page('princess', 14, (p) => {
    const C = [460, 720, 280, 140] as const;
    p.ellipse(...C); // body
    p.path(
      `M605 ${ey(...C, 605, -1)} C540 490 480 430 515 380 C545 330 570 300 598 215 C605 150 650 125 685 135 C720 140 735 165 740 190 L815 205 L748 235 C742 250 735 262 725 270 C690 290 655 300 640 330 C610 380 620 430 660 480 C685 520 695 560 695 ${ey(...C, 695, -1)}`,
    ); // neck, head and beak
    p.circle(672, 185, 13);
    crown(p, 665, 140, 80, 50);
    p.path('M240 730 Q300 610 470 650 Q520 750 380 830 Q260 820 240 730 Z'); // wing
    p.path('M310 710 Q370 680 410 730');
    p.path(`M200 ${ey(...C, 200, -1)} Q100 600 60 510 Q170 580 250 ${ey(...C, 250, -1)}`); // tail
    p.path('M40 905 Q110 855 180 905 T320 905 T460 905 T600 905 T740 905 T880 905 T960 905');
    p.path('M80 970 Q150 920 220 970 T360 970 T500 970 T640 970 T780 970 T920 970');
    p.circle(880, 560, 28);
    star4(p, 110, 150, 50);
    star4(p, 400, 130, 38);
  }),
  // 15 — Royal teapot
  page('princess', 15, (p) => {
    const C = [480, 560, 270, 230] as const;
    p.ellipse(...C); // body
    const hy = (y: number) => ex(...C, y, -1);
    p.path(
      `M${hy(480)} 480 Q90 470 90 600 Q90 740 ${hy(710)} 710 L${hy(680)} 680 Q170 690 170 600 Q170 510 ${hy(510)} 510`,
    ); // handle
    const sx = (y: number) => ex(...C, y, 1);
    p.path(`M${sx(520)} 520 Q780 520 830 390 L880 410 Q860 590 ${sx(640)} 640`); // spout
    p.path(`M395 ${ey(...C, 395, -1)} Q480 220 565 ${ey(...C, 565, -1)}`); // lid
    p.circle(480, 215, 30);
    p.heart(480, 570, 190);
    p.path('M330 440 Q480 400 630 440');
    p.path('M335 690 Q480 730 625 690');
    p.path('M880 330 Q920 270 880 210'); // steam
    p.path('M830 300 Q870 240 830 180');
    p.ellipse(480, 910, 250, 30);
    star4(p, 110, 150, 50);
    star4(p, 880, 880, 45);
  }),
];
