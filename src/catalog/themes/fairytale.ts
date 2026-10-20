import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

// Fairytale — 15 distinct subjects (no princess portraits):
// 1 friendly dragon, 2 knight with sword and shield, 3 castle on a hill, 4 magic lamp with smoke,
// 5 wizard with wand, 6 mushroom cottage, 7 frog with crown, 8 open spell book, 9 treasure chest,
// 10 garden gnome, 11 pumpkin carriage, 12 potion bottles and wand, 13 flying carpet,
// 14 beanstalk, 15 wise owl on a branch.

function eye(p: Pen, x: number, y: number, r: number): void {
  p.circle(x, y, r);
  if (r >= 34) p.circle(x, y, r * 0.5);
}
function mirror(pts: [number, number][]): [number, number][] {
  return pts.map(([x, y]) => [1000 - x, y]);
}
/** Horizontal chord across an ellipse at height y (decorative band lines that split a region). */
function chord(p: Pen, cx: number, cy: number, rx: number, ry: number, y: number): void {
  const h = rx * Math.sqrt(1 - ((y - cy) / ry) ** 2) - 2;
  p.line(cx - h, y, cx + h, y);
}
function spokes(p: Pen, cx: number, cy: number, r0: number, r1: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI * 2) / n + Math.PI / 4;
    p.line(
      cx + r0 * Math.cos(a),
      cy + r0 * Math.sin(a),
      cx + r1 * Math.cos(a),
      cy + r1 * Math.sin(a),
    );
  }
}
function cloud(p: Pen, x: number, y: number, s: number): void {
  const c = (n: number) => n * s;
  p.path(
    `M${x} ${y} C${x - c(30)} ${y} ${x - c(40)} ${y - c(50)} ${x} ${y - c(55)} ` +
      `C${x - c(5)} ${y - c(100)} ${x + c(60)} ${y - c(110)} ${x + c(80)} ${y - c(75)} ` +
      `C${x + c(100)} ${y - c(120)} ${x + c(170)} ${y - c(100)} ${x + c(165)} ${y - c(55)} ` +
      `C${x + c(205)} ${y - c(50)} ${x + c(200)} ${y} ${x + c(165)} ${y} Z`,
  );
}

export const pages: PageDef[] = [
  // 1 dragon
  page('fairytale', 1, (p) => {
    const wing: [number, number][] = [
      [300, 520],
      [110, 340],
      [150, 470],
      [90, 545],
      [190, 590],
      [140, 665],
      [272, 625],
    ];
    p.poly(wing);
    p.poly(mirror(wing));
    p.path('M718 750 C850 800 950 760 935 650 L890 690 C850 710 790 700 725 690 Z');
    p.ellipse(500, 650, 230, 250);
    p.ellipse(500, 690, 140, 170);
    [610, 690, 770].forEach((y) => chord(p, 500, 690, 140, 170, y));
    p.ellipse(375, 880, 95, 45);
    p.ellipse(625, 880, 95, 45);
    p.poly([
      [385, 205],
      [335, 60],
      [455, 165],
    ]);
    p.poly([
      [615, 205],
      [665, 60],
      [545, 165],
    ]);
    p.ellipse(500, 310, 180, 150);
    eye(p, 420, 270, 32);
    eye(p, 580, 270, 32);
    p.ellipse(500, 370, 105, 65);
    p.circle(465, 355, 15);
    p.circle(535, 355, 15);
  }),
  // 2 knight
  page('fairytale', 2, (p) => {
    p.path('M470 160 Q430 70 520 55 Q620 55 540 160 Z');
    p.path('M370 340 L370 240 Q370 135 500 135 Q630 135 630 240 L630 340 Z');
    p.ellipse(500, 270, 85, 90);
    p.circle(468, 255, 16);
    p.circle(532, 255, 16);
    p.path('M465 305 Q500 335 535 305');
    p.roundRect(340, 360, 320, 260, 50);
    p.rect(340, 530, 320, 50);
    p.circle(500, 555, 20);
    p.roundRect(660, 385, 140, 70, 32);
    p.circle(820, 425, 44);
    p.poly([
      [800, 350],
      [840, 350],
      [840, 150],
      [820, 100],
      [800, 150],
    ]);
    p.roundRect(780, 322, 80, 28, 12);
    p.roundRect(385, 620, 95, 200, 30);
    p.roundRect(520, 620, 95, 200, 30);
    p.roundRect(345, 800, 150, 85, 36);
    p.roundRect(505, 800, 150, 85, 36);
    p.path('M120 400 L330 400 L330 570 Q330 660 225 720 Q120 660 120 570 Z');
    p.star(225, 530, 62, 27, 5);
  }),
  // 3 castle on hill
  page('fairytale', 3, (p) => {
    cloud(p, 60, 200, 0.8);
    cloud(p, 700, 150, 0.9);
    p.path('M50 900 Q150 720 300 680 L700 680 Q850 720 950 900 Z');
    p.rect(360, 440, 280, 240);
    p.rect(240, 380, 120, 300);
    p.rect(640, 380, 120, 300);
    p.rect(430, 280, 140, 160);
    p.poly([
      [225, 380],
      [300, 250],
      [375, 380],
    ]);
    p.poly([
      [625, 380],
      [700, 250],
      [775, 380],
    ]);
    p.poly([
      [415, 280],
      [500, 150],
      [585, 280],
    ]);
    p.line(500, 150, 500, 100);
    p.poly([
      [500, 100],
      [575, 122],
      [500, 144],
    ]);
    p.roundRect(275, 450, 50, 80, 24);
    p.roundRect(675, 450, 50, 80, 24);
    p.roundRect(475, 330, 50, 70, 24);
    p.circle(410, 520, 26);
    p.circle(590, 520, 26);
    p.path('M445 680 L445 590 Q500 520 555 590 L555 680 Z');
    p.poly([
      [445, 680],
      [555, 680],
      [640, 900],
      [360, 900],
    ]);
  }),
  // 4 magic lamp
  page('fairytale', 4, (p) => {
    p.path(
      'M120 450 Q50 340 140 280 Q220 220 150 150 Q130 90 200 70 Q290 60 275 135 Q260 190 215 250 Q150 310 200 360 Q240 400 200 470 Z',
    );
    p.path('M285 600 C190 590 140 540 110 460 C170 450 250 500 324 560 Z');
    p.ellipse(500, 650, 230, 140);
    [610, 700].forEach((y) => chord(p, 500, 650, 230, 140, y));
    p.circle(500, 655, 36);
    p.ellipse(500, 530, 105, 38);
    p.circle(500, 475, 34);
    p.path('M715 600 C860 540 930 680 790 750 L755 690 C830 660 810 600 725 630 Z');
    p.rect(450, 760, 100, 65);
    p.roundRect(370, 825, 260, 55, 26);
    p.star(520, 160, 70, 30, 5);
    p.star(760, 300, 45, 20, 5);
    p.star(380, 330, 38, 17, 5);
    p.heart(820, 880, 90);
  }),
  // 5 wizard
  page('fairytale', 5, (p) => {
    p.path('M320 310 Q440 240 470 100 Q500 40 540 90 Q640 200 680 310 Z');
    p.star(490, 215, 38, 17, 5);
    p.ellipse(500, 320, 235, 50);
    p.ellipse(500, 440, 95, 100);
    p.circle(465, 425, 16);
    p.circle(535, 425, 16);
    p.path('M360 570 L250 900 L750 900 L640 570 Q500 640 360 570 Z');
    p.path('M410 470 Q380 760 500 880 Q620 760 590 470 Q500 540 410 470 Z');
    p.circle(500, 500, 30);
    p.roundRect(655, 590, 140, 60, 30);
    p.circle(810, 620, 38);
    p.poly([
      [815, 590],
      [840, 600],
      [900, 370],
      [875, 360],
    ]);
    p.star(895, 300, 62, 27, 5);
    p.roundRect(205, 640, 140, 60, 30);
    p.circle(190, 670, 38);
    p.star(330, 840, 36, 16, 5);
    p.star(670, 840, 36, 16, 5);
  }),
  // 6 mushroom house
  page('fairytale', 6, (p) => {
    p.roundRect(350, 470, 300, 410, 60);
    p.path('M110 480 A390 340 0 0 1 890 480 Z');
    p.circle(290, 330, 55);
    p.circle(520, 250, 62);
    p.circle(740, 340, 50);
    p.circle(430, 410, 34);
    p.circle(640, 430, 30);
    p.path('M440 880 L440 750 Q500 670 560 750 L560 880 Z');
    p.circle(535, 800, 20);
    p.circle(400, 600, 36);
    p.circle(600, 600, 36);
    p.path('M60 880 A80 70 0 0 1 220 880 Z');
    p.rect(120, 880, 40, 40);
    p.path('M780 880 A80 70 0 0 1 940 880 Z');
    p.rect(840, 880, 40, 40);
  }),
  // 7 frog
  page('fairytale', 7, (p) => {
    p.ellipse(500, 900, 420, 55);
    p.ellipse(500, 590, 330, 260);
    p.circle(305, 305, 90);
    p.circle(695, 305, 90);
    p.circle(305, 300, 50);
    p.circle(695, 300, 50);
    p.circle(312, 308, 20);
    p.circle(688, 308, 20);
    p.poly([
      [435, 335],
      [425, 200],
      [465, 255],
      [500, 160],
      [535, 255],
      [575, 200],
      [565, 335],
    ]);
    p.circle(500, 290, 20);
    p.circle(465, 470, 15);
    p.circle(535, 470, 15);
    p.path('M280 590 Q500 800 720 590');
    p.circle(225, 625, 38);
    p.circle(775, 625, 38);
    p.ellipse(270, 810, 85, 45, -0.3);
    p.ellipse(730, 810, 85, 45, 0.3);
  }),
  // 8 spell book
  page('fairytale', 8, (p) => {
    p.path('M500 450 Q330 390 110 430 L110 775 Q330 735 500 790 Z');
    p.path('M500 450 Q670 390 890 430 L890 775 Q670 735 500 790 Z');
    p.path('M80 810 Q320 780 500 840 Q680 780 920 810 L920 880 Q680 850 500 910 Q320 850 80 880 Z');
    p.star(300, 600, 100, 44, 5);
    p.circle(700, 600, 105);
    p.heart(700, 605, 100);
    p.star(500, 130, 65, 28, 5);
    p.star(330, 250, 48, 21, 5);
    p.star(670, 250, 48, 21, 5);
    p.star(180, 170, 36, 16, 5);
    p.star(820, 170, 36, 16, 5);
  }),
  // 9 treasure chest
  page('fairytale', 9, (p) => {
    p.rect(200, 520, 600, 320);
    p.path('M200 520 L200 420 Q200 280 500 280 Q800 280 800 420 L800 520 Z');
    p.line(300, 305, 300, 520);
    p.line(370, 288, 370, 520);
    p.line(630, 288, 630, 520);
    p.line(700, 305, 700, 520);
    p.rect(300, 520, 70, 320);
    p.rect(630, 520, 70, 320);
    p.roundRect(445, 480, 110, 120, 22);
    p.circle(500, 535, 20);
    p.star(500, 150, 60, 26, 5);
    p.star(240, 190, 45, 20, 5);
    p.star(760, 200, 45, 20, 5);
    p.circle(110, 900, 50);
    p.circle(110, 900, 24);
    p.circle(230, 920, 40);
    p.poly([
      [700, 920],
      [760, 860],
      [820, 920],
      [760, 975],
    ]);
    p.circle(900, 900, 50);
    p.circle(900, 900, 24);
  }),
  // 10 gnome
  page('fairytale', 10, (p) => {
    p.ellipse(400, 930, 75, 30);
    p.ellipse(600, 930, 75, 30);
    p.path('M345 640 L280 890 L720 890 L655 640 Z');
    p.path('M300 380 Q400 330 440 190 Q470 90 600 70 Q560 170 590 250 Q640 330 700 380 Z');
    p.ellipse(500, 450, 115, 100);
    p.circle(440, 430, 16);
    p.circle(560, 430, 16);
    p.circle(500, 472, 30);
    p.path('M392 525 Q340 790 500 850 Q660 790 608 525 Z');
    p.path('M730 880 A110 90 0 0 1 950 880 Z');
    p.rect(810, 880, 60, 50);
    p.circle(130, 850, 42);
    p.circle(130, 850, 16);
    p.line(130, 892, 130, 930);
  }),
  // 11 pumpkin carriage
  page('fairytale', 11, (p) => {
    p.circle(830, 180, 75);
    p.star(180, 170, 50, 22, 5);
    p.roundRect(470, 215, 60, 76, 20);
    p.ellipse(500, 520, 300, 230);
    p.path('M440 295 Q330 520 440 745');
    p.path('M350 321 Q220 520 350 719');
    p.path('M560 295 Q670 520 560 745');
    p.path('M650 321 Q780 520 650 719');
    p.circle(250, 780, 110);
    p.circle(250, 780, 30);
    spokes(p, 250, 780, 30, 110, 4);
    p.circle(750, 780, 110);
    p.circle(750, 780, 30);
    spokes(p, 750, 780, 30, 110, 4);
  }),
  // 12 potions
  page('fairytale', 12, (p) => {
    p.roundRect(210, 350, 100, 60, 20);
    p.rect(225, 410, 70, 110);
    p.circle(260, 660, 160);
    chord(p, 260, 660, 160, 160, 640);
    p.circle(220, 740, 24);
    p.circle(300, 770, 20);
    p.roundRect(540, 330, 110, 60, 20);
    p.rect(560, 390, 70, 110);
    p.roundRect(480, 500, 230, 360, 60);
    p.star(595, 680, 70, 30, 5);
    p.poly([
      [760, 900],
      [790, 920],
      [930, 480],
      [900, 468],
    ]);
    p.star(920, 400, 65, 28, 5);
    p.star(430, 150, 40, 18, 5);
    p.star(130, 180, 40, 18, 5);
  }),
  // 13 flying carpet
  page('fairytale', 13, (p) => {
    p.circle(790, 190, 90);
    p.star(200, 170, 55, 24, 5);
    p.star(450, 110, 40, 18, 5);
    p.star(120, 400, 36, 16, 5);
    p.path(
      'M110 520 Q330 440 500 510 Q680 580 890 480 L850 720 Q670 800 500 740 Q330 680 150 770 Z',
    );
    p.path(
      'M180 580 Q330 510 500 570 Q680 635 820 565 L800 665 Q670 745 500 690 Q330 635 200 705 Z',
    );
    p.star(500, 635, 44, 20, 5);
    p.heart(340, 625, 56);
    p.heart(665, 650, 56);
    [560, 612, 664, 716].forEach((y, i) => p.roundRect(55 + i * 8, y, 55, 28, 13));
    [490, 542, 594, 646].forEach((y, i) => p.roundRect(890 - i * 6, y, 55, 28, 13));
    cloud(p, 120, 920, 1.1);
    cloud(p, 600, 930, 1.3);
  }),
  // 14 beanstalk
  page('fairytale', 14, (p) => {
    p.circle(850, 150, 75);
    cloud(p, 70, 260, 0.9);
    cloud(p, 330, 230, 1.6);
    p.path(
      'M480 230 L580 230 C650 350 520 430 580 560 C640 690 530 780 570 910 L450 910 C430 780 540 690 480 560 C420 430 550 350 480 230 Z',
    );
    p.ellipse(375, 770, 115, 46, -0.4);
    p.ellipse(670, 700, 115, 46, 0.4);
    p.ellipse(380, 540, 105, 44, -0.4);
    p.ellipse(675, 440, 105, 44, 0.45);
    p.ellipse(420, 340, 70, 32, -0.5);
    p.rect(40, 910, 920, 50);
    p.rect(80, 790, 180, 120);
    p.poly([
      [60, 790],
      [170, 690],
      [280, 790],
    ]);
    p.roundRect(125, 835, 60, 75, 24);
  }),
  // 15 owl
  page('fairytale', 15, (p) => {
    p.circle(850, 180, 85);
    p.star(150, 160, 50, 22, 5);
    p.star(260, 330, 32, 14, 5);
    p.roundRect(70, 790, 860, 60, 30);
    p.poly([
      [318, 309],
      [320, 170],
      [430, 227],
    ]);
    p.poly([
      [682, 309],
      [680, 170],
      [570, 227],
    ]);
    p.ellipse(500, 515, 250, 300);
    p.ellipse(500, 625, 160, 185);
    p.circle(405, 365, 84);
    p.circle(595, 365, 84);
    eye(p, 405, 367, 48);
    eye(p, 595, 367, 48);
    p.poly([
      [468, 435],
      [532, 435],
      [500, 500],
    ]);
    p.ellipse(270, 590, 70, 185, 0.15);
    p.ellipse(730, 590, 70, 185, -0.15);
    p.path('M420 610 Q500 650 580 610');
    p.path('M410 690 Q500 730 590 690');
  }),
];
