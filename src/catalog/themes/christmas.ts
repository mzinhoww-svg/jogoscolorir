import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

// Christmas — 15 distinct subjects:
// 1 Christmas tree, 2 Santa face, 3 snowman, 4 pile of presents, 5 stocking, 6 reindeer face,
// 7 wreath with bow, 8 gingerbread man, 9 pair of bells, 10 snowy cottage, 11 sleigh with gifts,
// 12 hanging baubles, 13 candle with holly, 14 mitten and woolly hat, 15 penguin with scarf.

function snow(p: Pen, x: number, y: number, r: number): void {
  p.star(x, y, r, r * 0.45, 6);
}
function eye(p: Pen, x: number, y: number, r: number): void {
  p.circle(x, y, r);
  if (r >= 34) p.circle(x, y, r * 0.5);
}
function mirror(pts: [number, number][]): [number, number][] {
  return pts.map(([x, y]) => [1000 - x, y]);
}
function holly(p: Pen, x: number, y: number): void {
  p.ellipse(x - 95, y, 80, 34, 0.35);
  p.ellipse(x + 95, y, 80, 34, -0.35);
  p.circle(x - 34, y + 92, 26);
  p.circle(x + 34, y + 92, 26);
}
function bow(p: Pen, x: number, y: number, s: number): void {
  const c = (n: number) => n * s;
  p.poly([
    [x - c(20), y],
    [x - c(95), y - c(42)],
    [x - c(100), y + c(42)],
  ]);
  p.poly([
    [x + c(20), y],
    [x + c(95), y - c(42)],
    [x + c(100), y + c(42)],
  ]);
  p.circle(x, y, c(20));
}
function bell(p: Pen, cx: number, top: number, s: number): void {
  const c = (n: number) => n * s;
  p.path(
    `M${cx} ${top + c(60)} C${cx - c(110)} ${top + c(60)} ${cx - c(150)} ${top + c(190)} ${cx - c(160)} ${top + c(310)} ` +
      `L${cx - c(200)} ${top + c(440)} L${cx + c(200)} ${top + c(440)} L${cx + c(160)} ${top + c(310)} ` +
      `C${cx + c(150)} ${top + c(190)} ${cx + c(110)} ${top + c(60)} ${cx} ${top + c(60)} Z`,
  );
  p.roundRect(cx - c(210), top + c(430), c(420), c(50), c(25));
  p.circle(cx, top + c(540), c(48));
  p.circle(cx, top + c(30), c(32));
}

export const pages: PageDef[] = [
  // 1 tree
  page('christmas', 1, (p) => {
    p.star(500, 112, 68, 30, 5);
    p.poly([
      [500, 190],
      [385, 340],
      [440, 340],
      [320, 500],
      [380, 500],
      [225, 690],
      [775, 690],
      [620, 500],
      [680, 500],
      [560, 340],
      [615, 340],
    ]);
    p.rect(435, 690, 130, 140);
    p.circle(500, 290, 30);
    p.circle(440, 440, 32);
    p.circle(570, 430, 32);
    p.circle(350, 610, 34);
    p.circle(500, 590, 34);
    p.circle(650, 610, 34);
    snow(p, 130, 180, 50);
    snow(p, 880, 270, 55);
    snow(p, 130, 800, 45);
    snow(p, 880, 800, 45);
  }),
  // 2 Santa face
  page('christmas', 2, (p) => {
    p.circle(500, 95, 50);
    p.path('M290 360 Q300 160 500 145 Q700 160 710 360 Z');
    p.path('M290 460 Q240 800 500 930 Q760 800 710 460 Z');
    p.ellipse(500, 520, 160, 150);
    p.roundRect(250, 360, 500, 100, 48);
    eye(p, 425, 515, 26);
    eye(p, 575, 515, 26);
    p.circle(500, 565, 34);
    p.ellipse(415, 655, 70, 36, -0.25);
    p.ellipse(585, 655, 70, 36, 0.25);
    p.ellipse(500, 760, 45, 26);
  }),
  // 3 snowman
  page('christmas', 3, (p) => {
    p.circle(500, 745, 185);
    p.circle(500, 480, 135);
    p.circle(500, 262, 108);
    p.rect(430, 45, 140, 105);
    p.roundRect(385, 140, 230, 44, 20);
    p.circle(455, 235, 20);
    p.circle(545, 235, 20);
    p.poly([
      [500, 272],
      [500, 302],
      [595, 287],
    ]);
    p.path('M455 322 Q500 350 545 322');
    p.circle(500, 440, 24);
    p.circle(500, 510, 24);
    p.path('M370 470 L225 380 L180 400');
    p.path('M225 380 L215 320');
    p.path('M630 470 L775 380 L820 400');
    p.path('M775 380 L785 320');
    p.circle(500, 680, 24);
    p.circle(500, 760, 24);
    snow(p, 120, 150, 50);
    snow(p, 880, 170, 55);
    snow(p, 120, 700, 45);
    snow(p, 890, 720, 50);
  }),
  // 4 presents
  page('christmas', 4, (p) => {
    p.rect(110, 580, 410, 290);
    p.rect(90, 510, 450, 70);
    p.rect(275, 510, 80, 360);
    bow(p, 315, 465, 1.1);
    p.rect(570, 700, 320, 170);
    p.rect(550, 630, 360, 70);
    p.rect(690, 630, 80, 240);
    p.rect(620, 450, 220, 180);
    p.rect(690, 450, 80, 180);
    bow(p, 730, 415, 0.95);
    p.star(210, 210, 60, 26, 5);
    p.star(440, 120, 45, 20, 5);
    p.star(880, 220, 50, 22, 5);
  }),
  // 5 stocking
  page('christmas', 5, (p) => {
    p.roundRect(200, 100, 340, 120, 30);
    p.path(
      'M235 220 L505 220 L505 560 Q505 620 580 650 Q760 700 750 810 Q740 890 650 890 L400 890 Q235 890 235 740 Z',
    );
    p.heart(370, 440, 150);
    p.line(235, 330, 505, 330);
    p.circle(330, 160, 26);
    p.circle(410, 160, 26);
    p.circle(490, 160, 26);
    p.ellipse(650, 800, 90, 70);
    p.circle(330, 770, 40);
    p.star(820, 230, 70, 30, 5);
    snow(p, 800, 480, 50);
    snow(p, 120, 560, 45);
  }),
  // 6 reindeer
  page('christmas', 6, (p) => {
    p.poly([
      [392, 433],
      [360, 300],
      [235, 285],
      [222, 235],
      [352, 250],
      [335, 160],
      [285, 110],
      [320, 80],
      [362, 125],
      [380, 50],
      [425, 60],
      [430, 200],
      [436, 404],
    ]);
    p.poly(
      mirror([
        [392, 433],
        [360, 300],
        [235, 285],
        [222, 235],
        [352, 250],
        [335, 160],
        [285, 110],
        [320, 80],
        [362, 125],
        [380, 50],
        [425, 60],
        [430, 200],
        [436, 404],
      ]),
    );
    p.ellipse(500, 620, 185, 230);
    p.ellipse(270, 520, 85, 42, -0.5);
    p.ellipse(730, 520, 85, 42, 0.5);
    eye(p, 430, 560, 34);
    eye(p, 570, 560, 34);
    p.ellipse(500, 735, 120, 85);
    p.circle(500, 705, 48);
    p.path('M430 770 Q500 825 570 770');
    p.path('M500 755 L500 790');
    snow(p, 120, 800, 50);
    snow(p, 880, 800, 50);
    snow(p, 130, 330, 40);
  }),
  // 7 wreath
  page('christmas', 7, (p) => {
    p.circle(500, 460, 350);
    p.circle(500, 460, 200);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      if (Math.sin(a) > 0.5) continue;
      const r = i % 2 === 0 ? 240 : 312;
      p.ellipse(500 + r * Math.cos(a), 460 + r * Math.sin(a), 70, 26, a + Math.PI / 2);
    }
    bow(p, 500, 810, 1.2);
    p.poly([
      [480, 832],
      [420, 940],
      [480, 915],
    ]);
    p.poly([
      [520, 832],
      [580, 940],
      [520, 915],
    ]);
  }),
  // 8 gingerbread man
  page('christmas', 8, (p) => {
    p.path(
      'M500 80 C590 80 650 150 650 230 C650 300 610 350 560 370 L800 350 C880 340 930 400 890 460 ' +
        'C860 500 800 490 760 480 L620 470 L650 640 L740 830 C770 900 700 940 650 910 L530 760 L500 740 ' +
        'L470 760 L350 910 C300 940 230 900 260 830 L350 640 L380 470 L240 480 C200 490 140 500 110 460 ' +
        'C70 400 120 340 200 350 L440 370 C390 350 350 300 350 230 C350 150 410 80 500 80 Z',
    );
    p.circle(445, 215, 24);
    p.circle(555, 215, 24);
    p.path('M440 285 Q500 335 560 285');
    p.circle(500, 450, 28);
    p.circle(500, 540, 28);
    p.circle(500, 630, 28);
    p.line(805, 346, 805, 490);
    p.line(195, 346, 195, 490);
  }),
  // 9 bells
  page('christmas', 9, (p) => {
    bell(p, 285, 40, 0.88);
    bell(p, 715, 90, 0.88);
    bow(p, 500, 135, 0.85);
    holly(p, 500, 800);
  }),
  // 10 cottage
  page('christmas', 10, (p) => {
    p.circle(800, 160, 70);
    p.poly([
      [545, 383],
      [545, 320],
      [615, 320],
      [615, 440],
    ]);
    p.rect(230, 480, 400, 350);
    p.poly([
      [195, 480],
      [430, 290],
      [665, 480],
    ]);
    p.path(
      'M195 480 Q250 530 300 480 Q350 530 400 480 Q450 530 500 480 Q550 530 600 480 Q630 510 665 480',
    );
    p.path('M345 830 L345 730 Q405 650 465 730 L465 830 Z');
    p.rect(515, 560, 80, 80);
    p.line(555, 560, 555, 640);
    p.line(515, 600, 595, 600);
    p.rect(265, 560, 55, 55);
    p.rect(60, 830, 880, 110);
    p.poly([
      [790, 300],
      [720, 440],
      [760, 440],
      [690, 570],
      [740, 570],
      [650, 710],
      [930, 710],
      [840, 570],
      [890, 570],
      [820, 440],
      [860, 440],
    ]);
    p.rect(770, 710, 40, 120);
    snow(p, 120, 200, 45);
    snow(p, 300, 120, 35);
  }),
  // 11 sleigh
  page('christmas', 11, (p) => {
    p.circle(820, 140, 70);
    p.star(180, 150, 50, 22, 5);
    p.rect(330, 300, 140, 140);
    p.rect(380, 300, 40, 140);
    p.rect(520, 340, 160, 100);
    p.rect(580, 340, 40, 100);
    p.path('M130 440 L830 440 Q880 440 850 520 Q790 680 690 690 L250 690 Q130 600 130 440 Z');
    p.path('M175 540 Q480 620 790 540');
    p.heart(480, 620, 70);
    p.rect(300, 690, 45, 90);
    p.rect(620, 690, 45, 90);
    p.roundRect(110, 780, 780, 50, 25);
    p.path('M890 800 Q950 790 940 720 Q930 690 900 700');
    snow(p, 880, 330, 40);
    snow(p, 120, 880, 40);
  }),
  // 12 baubles
  page('christmas', 12, (p) => {
    p.line(100, 70, 900, 70);
    p.line(200, 70, 200, 420);
    p.line(500, 70, 500, 220);
    p.line(800, 70, 800, 410);
    p.roundRect(170, 420, 60, 50, 12);
    p.circle(200, 590, 120);
    p.ellipse(200, 590, 120, 40);
    p.roundRect(470, 220, 60, 50, 12);
    p.circle(500, 410, 140);
    p.star(500, 410, 95, 42, 5);
    p.roundRect(770, 410, 60, 50, 12);
    p.circle(800, 580, 120);
    p.heart(800, 585, 110);
    snow(p, 330, 830, 50);
    snow(p, 600, 800, 55);
    snow(p, 850, 860, 45);
    snow(p, 120, 860, 45);
  }),
  // 13 candle
  page('christmas', 13, (p) => {
    p.path('M500 80 Q590 200 500 300 Q410 200 500 80 Z');
    p.path('M500 170 Q540 220 500 270 Q460 220 500 170 Z');
    p.rect(420, 330, 160, 410);
    p.path('M420 330 Q420 380 450 380 Q470 380 470 340 L580 330');
    p.line(420, 480, 580, 440);
    p.line(420, 590, 580, 550);
    p.line(420, 700, 580, 665);
    p.roundRect(300, 740, 400, 60, 28);
    holly(p, 500, 835);
    p.star(200, 250, 55, 24, 5);
    p.star(800, 300, 50, 22, 5);
    snow(p, 200, 620, 45);
    snow(p, 810, 600, 45);
  }),
  // 14 mitten + hat
  page('christmas', 14, (p) => {
    p.path('M175 430 C145 260 225 130 335 140 C445 150 495 260 465 430 L465 590 L195 590 Z');
    p.ellipse(145, 450, 52, 95, 0.25);
    p.roundRect(170, 590, 320, 120, 28);
    p.heart(330, 390, 130);
    p.line(240, 650, 420, 650);
    p.circle(750, 240, 58);
    p.path('M560 590 Q560 330 750 300 Q940 330 940 590 Z');
    p.roundRect(540, 590, 420, 120, 40);
    p.path('M655 320 Q640 450 650 590');
    p.path('M850 320 Q860 450 850 590');
    p.path('M750 300 L750 590');
    snow(p, 140, 840, 55);
    snow(p, 460, 840, 50);
    snow(p, 780, 840, 55);
  }),
  // 15 penguin
  page('christmas', 15, (p) => {
    p.ellipse(500, 500, 235, 370);
    p.path('M352 470 Q330 720 430 840 Q500 880 570 840 Q670 720 648 470 Z');
    p.circle(435, 262, 56);
    p.circle(565, 262, 56);
    p.circle(435, 264, 22);
    p.circle(565, 264, 22);
    p.poly([
      [462, 325],
      [538, 325],
      [500, 380],
    ]);
    p.roundRect(290, 410, 420, 60, 28);
    p.roundRect(560, 455, 62, 140, 22);
    p.ellipse(255, 580, 55, 150, 0.2);
    p.ellipse(745, 580, 55, 150, -0.2);
    p.ellipse(400, 850, 85, 36);
    p.ellipse(600, 850, 85, 36);
    snow(p, 110, 220, 50);
    snow(p, 890, 250, 55);
    snow(p, 120, 820, 45);
    snow(p, 880, 820, 45);
  }),
];
