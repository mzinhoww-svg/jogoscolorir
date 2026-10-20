import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

/*
 * Space theme — 15 distinct subjects:
 *  1 rocket            2 ringed planet     3 friendly alien     4 astronaut        5 sleepy moon
 *  6 smiling sun       7 flying saucer     8 satellite          9 moon rover      10 comet
 * 11 space station    12 telescope        13 three-eyed blob   14 planet Earth   15 planet trio
 */

/** Y on an ellipse for a given x (sign -1 = top, +1 = bottom). */
const ey = (cx: number, cy: number, rx: number, ry: number, x: number, sign: 1 | -1) =>
  cy + sign * ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));

const star4 = (p: Pen, x: number, y: number, r: number) => p.star(x, y, r, r * 0.38, 4);

const eyes = (p: Pen, x: number, y: number, gap: number, r: number) => {
  p.circle(x - gap, y, r);
  p.circle(x + gap, y, r);
};

const smile = (p: Pen, x: number, y: number, w: number, d: number) =>
  p.path(`M${x - w} ${y} Q${x} ${y + d} ${x + w} ${y}`);

/** Convex bar between two points (for tilted tubes). */
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
  // 1 — Rocket
  page('space', 1, (p) => {
    p.path('M500 70 Q690 210 690 500 L690 700 L310 700 L310 500 Q310 210 500 70 Z'); // body
    p.circle(500, 320, 88); // porthole
    p.circle(500, 320, 52); // glass
    p.line(310, 500, 690, 500); // band
    p.line(310, 560, 690, 560);
    p.path('M310 560 L170 720 Q150 740 150 770 L150 830 L310 700'); // left fin
    p.path('M690 560 L830 720 Q850 740 850 770 L850 830 L690 700'); // right fin
    p.poly([
      [400, 700],
      [600, 700],
      [570, 770],
      [430, 770],
    ]); // nozzle
    p.path('M430 770 Q400 880 500 940 Q600 880 570 770'); // flame
    p.path('M470 770 Q460 840 500 870 Q540 840 530 770'); // inner flame
    p.star(150, 190, 50, 22, 5);
    p.star(860, 230, 44, 20, 5);
    p.circle(870, 450, 24);
    p.circle(130, 470, 20);
    smile(p, 500, 630, 60, 40);
  }),
  // 2 — Ringed planet
  page('space', 2, (p) => {
    p.circle(500, 500, 230); // planet
    p.path('M310 360 Q500 300 690 360'); // stripes
    p.path('M275 450 Q500 395 725 450');
    p.ellipse(500, 560, 440, 100, -0.22); // ring outer
    p.ellipse(500, 560, 340, 56, -0.22); // ring inner
    p.circle(400, 310, 34);
    p.circle(590, 700, 30);
    star4(p, 130, 170, 55);
    star4(p, 870, 160, 45);
    p.circle(840, 850, 26);
    p.circle(150, 860, 22);
  }),
  // 3 — Friendly alien
  page('space', 3, (p) => {
    p.ellipse(500, 420, 260, 235); // head
    p.line(390, 205, 330, 110); // antennae
    p.circle(322, 92, 34);
    p.line(610, 205, 670, 110);
    p.circle(678, 92, 34);
    p.ellipse(405, 420, 62, 80, 0.15); // eyes
    p.ellipse(595, 420, 62, 80, -0.15);
    p.circle(420, 432, 26);
    p.circle(580, 432, 26);
    smile(p, 500, 560, 85, 60);
    // body (open at the top, closed by the head outline)
    const xl = 370;
    const xr = 630;
    p.path(
      `M${xl} ${ey(500, 420, 260, 235, xl, 1)} L330 760 Q330 820 400 820 L600 820 Q670 820 670 760 L${xr} ${ey(500, 420, 260, 235, xr, 1)}`,
    );
    p.circle(500, 720, 40); // belly button
    p.ellipse(290, 700, 48, 100, 0.5); // arms
    p.ellipse(710, 700, 48, 100, -0.5);
    p.ellipse(430, 900, 60, 28); // feet
    p.ellipse(570, 900, 60, 28);
  }),
  // 4 — Astronaut
  page('space', 4, (p) => {
    p.circle(500, 260, 175); // helmet
    p.roundRect(375, 175, 250, 175, 80); // visor
    p.circle(440, 225, 18); // shine
    const xl = 380;
    const xr = 620;
    const yl = ey(500, 260, 175, 175, xl, 1);
    p.path(
      `M${xl} ${yl} Q290 400 290 480 L290 720 Q290 790 360 790 L640 790 Q710 790 710 720 L710 480 Q710 400 ${xr} ${yl}`,
    ); // torso
    p.roundRect(410, 520, 180, 120, 22); // chest panel
    p.circle(460, 580, 20);
    p.circle(540, 580, 20);
    p.ellipse(235, 560, 55, 140, 0.3); // arms
    p.ellipse(765, 560, 55, 140, -0.3);
    p.roundRect(350, 770, 120, 150, 40); // legs
    p.roundRect(530, 770, 120, 150, 40);
    smile(p, 500, 290, 40, 28);
    p.circle(130, 150, 22);
    star4(p, 870, 140, 45);
  }),
  // 5 — Sleepy moon
  page('space', 5, (p) => {
    p.circle(500, 500, 330); // moon
    p.circle(280, 330, 52); // craters
    p.circle(720, 300, 42);
    p.circle(740, 640, 62);
    p.circle(290, 690, 38);
    p.path('M345 480 Q400 520 455 480'); // sleeping eyes
    p.path('M545 480 Q600 520 655 480');
    p.circle(360, 570, 30); // cheeks
    p.circle(640, 570, 30);
    smile(p, 500, 590, 55, 45);
    star4(p, 110, 120, 50);
    star4(p, 890, 130, 38);
    star4(p, 910, 880, 44);
    p.circle(110, 880, 24);
  }),
  // 6 — Smiling sun
  page('space', 6, (p) => {
    p.circle(500, 500, 210);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const r0 = 250;
      const r1 = 410;
      const w = 0.17;
      p.poly([
        [500 + r0 * Math.cos(a - w), 500 + r0 * Math.sin(a - w)],
        [500 + r1 * Math.cos(a), 500 + r1 * Math.sin(a)],
        [500 + r0 * Math.cos(a + w), 500 + r0 * Math.sin(a + w)],
      ]);
    }
    eyes(p, 500, 450, 75, 28);
    smile(p, 500, 535, 100, 80);
    p.circle(360, 560, 28);
    p.circle(640, 560, 28);
  }),
  // 7 — Flying saucer
  page('space', 7, (p) => {
    p.ellipse(500, 520, 400, 110); // disc
    p.path(
      `M330 ${ey(500, 520, 400, 110, 330, -1)} C330 240 670 240 670 ${ey(500, 520, 400, 110, 670, -1)}`,
    ); // dome
    p.circle(500, 350, 72); // alien head in dome
    eyes(p, 500, 345, 26, 15);
    smile(p, 500, 378, 22, 16);
    p.circle(230, 535, 28); // lights
    p.circle(380, 575, 28);
    p.circle(620, 575, 28);
    p.circle(770, 535, 28);
    p.path(
      `M390 ${ey(500, 520, 400, 110, 390, 1)} L250 900 L750 900 L610 ${ey(500, 520, 400, 110, 610, 1)}`,
    ); // beam
    star4(p, 110, 160, 50);
    star4(p, 880, 150, 42);
    p.circle(900, 740, 24);
    p.circle(110, 700, 22);
  }),
  // 8 — Satellite
  page('space', 8, (p) => {
    p.roundRect(390, 380, 220, 240, 36); // body
    p.circle(500, 480, 50); // window
    p.roundRect(60, 400, 250, 200, 14); // left panel
    p.line(143, 400, 143, 600);
    p.line(227, 400, 227, 600);
    p.line(60, 500, 310, 500);
    p.roundRect(690, 400, 250, 200, 14); // right panel
    p.line(773, 400, 773, 600);
    p.line(857, 400, 857, 600);
    p.line(690, 500, 940, 500);
    p.rect(310, 480, 80, 40); // arms
    p.rect(610, 480, 80, 40);
    p.line(500, 380, 500, 290); // antenna
    p.circle(500, 260, 30);
    p.path('M420 640 Q500 800 580 640 Z'); // dish
    p.line(500, 700, 500, 770);
    p.circle(500, 800, 28);
    star4(p, 130, 200, 50);
    star4(p, 860, 220, 42);
    p.circle(220, 810, 22);
    p.circle(800, 800, 26);
  }),
  // 9 — Moon rover
  page('space', 9, (p) => {
    p.path('M40 760 Q300 690 520 740 Q760 790 960 720 L960 950 L40 950 Z'); // ground
    p.circle(250, 850, 36); // craters
    p.circle(620, 880, 30);
    p.circle(850, 830, 24);
    p.roundRect(230, 470, 540, 170, 44); // body
    p.path('M330 470 L370 380 L630 380 L670 470'); // cabin
    p.roundRect(390, 405, 200, 50, 14); // window
    for (const x of [300, 500, 700]) {
      p.circle(x, 685, 62);
      p.circle(x, 685, 24);
    }
    p.line(710, 380, 770, 290); // antenna
    p.path('M740 290 Q790 240 830 300 Z');
    p.circle(800, 160, 90); // Earth in the sky
    p.path('M760 130 Q790 110 810 140 Q830 170 800 190 Q770 170 760 130 Z');
    star4(p, 120, 130, 50);
    star4(p, 380, 240, 34);
    p.circle(200, 330, 20);
    smile(p, 500, 565, 60, 35);
  }),
  // 10 — Comet
  page('space', 10, (p) => {
    const cx = 330;
    const cy = 690;
    const r = 175;
    const pt = (deg: number): [number, number] => [
      cx + r * Math.cos((deg * Math.PI) / 180),
      cy + r * Math.sin((deg * Math.PI) / 180),
    ];
    const a = pt(-85);
    const b = pt(5);
    p.circle(cx, cy, r); // head
    p.path(`M${a[0]} ${a[1]} C560 440 760 300 900 110 C860 330 700 560 ${b[0] + 5} ${b[1] + 25}`); // tail
    p.path('M450 600 Q640 450 800 260'); // tail streaks
    p.path('M490 665 Q660 560 835 400');
    eyes(p, cx, 650, 62, 26);
    smile(p, cx, 725, 55, 45);
    p.circle(cx - 100, cy + 40, 24);
    p.circle(cx + 100, cy + 40, 24);
    star4(p, 140, 180, 55);
    star4(p, 520, 150, 40);
    p.circle(880, 880, 24);
    p.circle(130, 460, 22);
  }),
  // 11 — Space station
  page('space', 11, (p) => {
    p.roundRect(300, 400, 400, 200, 60); // main module
    p.circle(400, 500, 42);
    p.circle(500, 500, 42);
    p.circle(600, 500, 42);
    p.roundRect(450, 230, 100, 170, 14); // top tube
    p.circle(500, 190, 56); // dome
    p.circle(500, 190, 22);
    p.roundRect(450, 600, 100, 130, 14); // bottom tube
    p.circle(500, 770, 52);
    p.roundRect(40, 300, 210, 400, 14); // left panel
    p.line(110, 300, 110, 700);
    p.line(180, 300, 180, 700);
    p.line(40, 500, 250, 500);
    p.rect(250, 480, 50, 40);
    p.roundRect(750, 300, 210, 400, 14); // right panel
    p.line(820, 300, 820, 700);
    p.line(890, 300, 890, 700);
    p.line(750, 500, 960, 500);
    p.rect(700, 480, 50, 40);
    star4(p, 880, 150, 46);
    star4(p, 130, 150, 40);
    p.circle(880, 860, 24);
    p.circle(130, 850, 26);
  }),
  // 12 — Telescope
  page('space', 12, (p) => {
    bar(p, 240, 665, 520, 435, 170, 135); // lower tube
    bar(p, 520, 435, 770, 230, 125, 165); // upper tube
    bar(p, 195, 703, 240, 665, 60, 90); // eyepiece
    p.poly([
      [495, 560],
      [545, 560],
      [420, 900],
      [320, 900],
    ]); // tripod legs
    p.poly([
      [495, 560],
      [545, 560],
      [740, 900],
      [640, 900],
    ]);
    p.circle(520, 520, 46); // mount
    p.circle(520, 520, 16);
    p.circle(170, 160, 80); // moon
    p.circle(150, 140, 20);
    star4(p, 560, 140, 40);
    star4(p, 880, 520, 46);
    p.circle(900, 780, 26);
    p.circle(130, 440, 22);
  }),
  // 13 — Three-eyed blob
  page('space', 13, (p) => {
    const C = [500, 430, 280, 245] as const;
    p.ellipse(C[0], C[1], C[2], C[3]);
    const legs = [250, 375, 535, 660];
    for (const a of legs) {
      const b = a + 90;
      p.path(`M${a} ${ey(...C, a, 1)} L${a} 780 Q${a + 45} 840 ${b} 780 L${b} ${ey(...C, b, 1)}`);
    }
    p.circle(350, 390, 56);
    p.circle(500, 330, 70);
    p.circle(650, 390, 56);
    p.circle(358, 398, 22);
    p.circle(500, 340, 28);
    p.circle(642, 398, 22);
    p.path('M390 520 Q500 640 610 520 Z'); // open mouth
    p.line(450, 540, 450, 580);
    p.line(550, 540, 550, 580);
    p.line(330, 130, 300, 60);
    p.circle(295, 45, 22);
    p.line(670, 130, 700, 60);
    p.circle(705, 45, 22);
  }),
  // 14 — Planet Earth
  page('space', 14, (p) => {
    p.circle(450, 560, 330);
    p.path('M240 400 Q300 320 380 360 Q440 400 400 460 Q330 480 260 520 Q200 470 240 400 Z'); // land
    p.path('M560 440 Q660 390 740 450 Q790 530 720 600 Q640 620 590 560 Q550 500 560 440 Z');
    p.path('M520 760 Q600 720 680 780 Q650 850 560 840 Q500 810 520 760 Z');
    p.path('M300 740 Q360 700 400 750 Q380 810 320 800 Q280 780 300 740 Z');
    p.circle(820, 170, 100); // moon
    p.circle(790, 145, 22);
    p.circle(850, 205, 18);
    star4(p, 110, 130, 50);
    star4(p, 540, 130, 36);
    p.circle(900, 700, 24);
    p.circle(930, 450, 20);
  }),
  // 15 — Planet trio
  page('space', 15, (p) => {
    const R = 215;
    p.circle(330, 420, R); // big planet with stripes
    for (const y of [330, 420, 510]) {
      const hw = Math.sqrt(R * R - (y - 420) ** 2);
      p.line(330 - hw, y, 330 + hw, y);
    }
    p.circle(765, 250, 115); // small planet
    p.circle(740, 225, 28);
    p.circle(800, 290, 22);
    p.circle(690, 740, 190); // medium planet
    p.path('M545 700 Q690 640 835 700');
    star4(p, 110, 800, 55);
    star4(p, 540, 130, 44);
    p.circle(900, 520, 24);
    p.circle(300, 860, 26);
  }),
];
