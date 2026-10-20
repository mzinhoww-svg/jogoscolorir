import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

// Robots — 15 distinct subjects:
// 1 round-screen robot head, 2 full-body robot with heart, 3 robot dog, 4 robot bird,
// 5 flying drone robot, 6 rover on treads, 7 gardener robot with flower, 8 gear robot,
// 9 jetpack robot among stars, 10 robot arm holding a star, 11 robot with balloons,
// 12 robot and toy blocks, 13 robot vacuum, 14 giant robot behind city, 15 spider robot.

function eye(p: Pen, x: number, y: number, r: number): void {
  p.circle(x, y, r);
  if (r >= 34) p.circle(x, y, r * 0.5);
}
/** Closed thick bar between two joint circles of radius r (ends trimmed to the circle edge). */
function bar(
  p: Pen,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  r1: number,
  r2 = r1,
): void {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const t1 = Math.sqrt(r1 * r1 - (w / 2) ** 2);
  const t2 = Math.sqrt(r2 * r2 - (w / 2) ** 2);
  const nx = (-uy * w) / 2;
  const ny = (ux * w) / 2;
  const [ax, ay, bx, by] = [x1 + ux * t1, y1 + uy * t1, x2 - ux * t2, y2 - uy * t2];
  p.poly([
    [ax + nx, ay + ny],
    [bx + nx, by + ny],
    [bx - nx, by - ny],
    [ax - nx, ay - ny],
  ]);
}
function smile(p: Pen, cx: number, cy: number, w: number, d = 0.8): void {
  p.path(`M${cx - w} ${cy} Q${cx} ${cy + w * d * 2} ${cx + w} ${cy}`);
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
function gear(p: Pen, cx: number, cy: number, r: number, teeth: number, depth: number): void {
  const pts: [number, number][] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const rs = [r, r + depth, r + depth, r];
    [-0.48, -0.3, 0.3, 0.48].forEach((o, k) => {
      const an = a + o * step;
      pts.push([cx + rs[k]! * Math.cos(an), cy + rs[k]! * Math.sin(an)]);
    });
  }
  p.poly(pts);
}

export const pages: PageDef[] = [
  // 1 head
  page('robots', 1, (p) => {
    p.line(500, 250, 500, 175);
    p.circle(500, 140, 40);
    p.roundRect(130, 430, 70, 160, 25);
    p.roundRect(800, 430, 70, 160, 25);
    p.roundRect(200, 250, 600, 540, 110);
    p.roundRect(270, 330, 460, 270, 70);
    eye(p, 390, 450, 68);
    eye(p, 610, 450, 68);
    p.roundRect(350, 650, 300, 90, 45);
    p.line(450, 650, 450, 740);
    p.line(550, 650, 550, 740);
  }),
  // 2 full body
  page('robots', 2, (p) => {
    p.roundRect(350, 90, 300, 230, 70);
    p.roundRect(315, 170, 35, 80, 10);
    p.roundRect(650, 170, 35, 80, 10);
    eye(p, 430, 190, 42);
    eye(p, 570, 190, 42);
    smile(p, 500, 255, 50, 0.5);
    p.rect(450, 320, 100, 40);
    p.roundRect(310, 360, 380, 320, 60);
    p.roundRect(395, 420, 210, 120, 30);
    p.heart(500, 485, 80);
    [430, 500, 570].forEach((x) => p.circle(x, 615, 24));
    p.roundRect(190, 380, 120, 200, 50);
    p.roundRect(690, 380, 120, 200, 50);
    p.circle(250, 590, 45);
    p.circle(750, 590, 45);
    p.roundRect(385, 680, 95, 180, 30);
    p.roundRect(520, 680, 95, 180, 30);
    p.roundRect(345, 840, 150, 80, 32);
    p.roundRect(505, 840, 150, 80, 32);
  }),
  // 3 robot dog
  page('robots', 3, (p) => {
    p.path('M258 430 C160 440 110 380 130 290 C190 330 230 340 262 360 Z');
    p.roundRect(250, 390, 430, 200, 45);
    p.roundRect(330, 440, 250, 90, 30);
    p.circle(400, 485, 24);
    p.circle(500, 485, 24);
    [300, 380, 490, 570].forEach((x) => p.roundRect(x, 590, 62, 210, 26));
    p.roundRect(620, 240, 260, 210, 75);
    p.poly([
      [690, 255],
      [665, 120],
      [790, 190],
      [780, 255],
    ]);
    eye(p, 770, 330, 36);
    p.circle(838, 395, 24);
    smile(p, 735, 415, 40, 0.5);
    p.roundRect(615, 440, 60, 90, 20);
  }),
  // 4 robot bird
  page('robots', 4, (p) => {
    p.poly([
      [290, 500],
      [90, 420],
      [100, 540],
      [140, 650],
      [290, 620],
    ]);
    p.ellipse(480, 550, 260, 230);
    p.circle(660, 300, 140);
    p.poly([
      [780, 280],
      [920, 330],
      [785, 380],
    ]);
    eye(p, 690, 265, 38);
    p.line(660, 160, 640, 100);
    p.circle(635, 70, 28);
    p.ellipse(410, 560, 140, 95, -0.45);
    p.circle(590, 680, 55);
    p.circle(590, 680, 20);
    p.line(425, 774, 415, 844);
    p.line(535, 774, 545, 844);
    p.ellipse(415, 870, 52, 26);
    p.ellipse(545, 870, 52, 26);
    smile(p, 690, 345, 30, 0.4);
  }),
  // 5 drone
  page('robots', 5, (p) => {
    p.ellipse(250, 285, 160, 28);
    p.ellipse(750, 285, 160, 28);
    p.roundRect(225, 305, 50, 125, 12);
    p.roundRect(725, 305, 50, 125, 12);
    p.path('M340 430 L180 430 A30 30 0 0 0 180 490 L340 490 Z');
    p.path('M660 430 L820 430 A30 30 0 0 1 820 490 L660 490 Z');
    p.roundRect(340, 380, 320, 270, 90);
    eye(p, 430, 490, 48);
    eye(p, 570, 490, 48);
    smile(p, 500, 575, 45, 0.45);
    p.line(500, 380, 500, 315);
    p.circle(500, 285, 30);
    p.roundRect(445, 650, 45, 100, 12);
    p.roundRect(510, 650, 45, 100, 12);
    p.roundRect(360, 750, 280, 50, 25);
    cloud(p, 70, 940, 1.1);
    cloud(p, 700, 960, 1.2);
  }),
  // 6 rover
  page('robots', 6, (p) => {
    p.line(500, 170, 500, 105);
    p.circle(500, 75, 30);
    p.roundRect(375, 170, 250, 150, 55);
    eye(p, 500, 245, 50);
    p.rect(455, 320, 90, 45);
    p.roundRect(270, 365, 460, 250, 50);
    p.roundRect(340, 410, 320, 90, 30);
    [415, 500, 585].forEach((x) => p.circle(x, 455, 24));
    p.roundRect(730, 430, 120, 50, 25);
    p.circle(885, 455, 36);
    p.roundRect(150, 430, 120, 50, 25);
    p.circle(115, 455, 36);
    p.roundRect(190, 560, 620, 210, 105);
    [320, 500, 680].forEach((x) => {
      p.circle(x, 665, 52);
      p.circle(x, 665, 20);
    });
  }),
  // 7 gardener
  page('robots', 7, (p) => {
    p.roundRect(110, 130, 260, 200, 65);
    eye(p, 190, 220, 33);
    eye(p, 290, 220, 33);
    smile(p, 240, 290, 30, 0.4);
    p.line(240, 130, 240, 85);
    p.circle(240, 65, 22);
    p.rect(200, 330, 80, 30);
    p.roundRect(100, 360, 280, 290, 55);
    p.circle(240, 460, 40);
    p.circle(240, 460, 15);
    p.roundRect(140, 650, 85, 200, 28);
    p.roundRect(255, 650, 85, 200, 28);
    p.roundRect(110, 830, 130, 70, 28);
    p.roundRect(240, 830, 130, 70, 28);
    p.roundRect(380, 420, 140, 70, 30);
    // flower
    p.rect(700, 520, 30, 250);
    p.circle(715, 400, 55);
    [0, 1, 2, 3, 4].forEach((i) => {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      p.circle(715 + 105 * Math.cos(a), 400 + 105 * Math.sin(a), 55);
    });
    p.ellipse(640, 640, 70, 32, -0.5);
    p.ellipse(790, 620, 70, 32, 0.5);
    p.poly([
      [620, 770],
      [820, 770],
      [790, 930],
      [650, 930],
    ]);
  }),
  // 8 gear robot
  page('robots', 8, (p) => {
    gear(p, 500, 420, 250, 12, 55);
    p.circle(500, 420, 205);
    eye(p, 410, 380, 52);
    eye(p, 590, 380, 52);
    smile(p, 500, 480, 70, 0.5);
    gear(p, 130, 840, 70, 8, 22);
    gear(p, 870, 840, 70, 8, 22);
    p.roundRect(390, 720, 80, 150, 26);
    p.roundRect(530, 720, 80, 150, 26);
    p.roundRect(350, 860, 130, 70, 28);
    p.roundRect(520, 860, 130, 70, 28);
  }),
  // 9 jetpack
  page('robots', 9, (p) => {
    p.star(150, 150, 50, 22, 5);
    p.star(860, 200, 60, 26, 5);
    p.star(850, 700, 40, 18, 5);
    p.star(130, 720, 45, 20, 5);
    p.roundRect(285, 420, 90, 200, 40);
    p.roundRect(625, 420, 90, 200, 40);
    p.poly([
      [295, 620],
      [365, 620],
      [330, 780],
    ]);
    p.poly([
      [635, 620],
      [705, 620],
      [670, 780],
    ]);
    p.roundRect(360, 80, 280, 200, 65);
    eye(p, 435, 165, 32);
    eye(p, 565, 165, 32);
    smile(p, 500, 235, 32, 0.4);
    p.roundRect(375, 295, 250, 280, 55);
    p.circle(500, 400, 45);
    p.circle(500, 400, 18);
    p.roundRect(225, 320, 150, 55, 26);
    p.roundRect(625, 320, 150, 55, 26);
    p.roundRect(410, 575, 75, 145, 26);
    p.roundRect(515, 575, 75, 145, 26);
    p.roundRect(375, 720, 110, 65, 26);
    p.roundRect(515, 720, 110, 65, 26);
  }),
  // 10 robot arm
  page('robots', 10, (p) => {
    p.roundRect(220, 790, 560, 130, 40);
    p.circle(330, 855, 28);
    p.circle(500, 855, 28);
    p.circle(670, 855, 28);
    p.roundRect(400, 680, 200, 110, 40);
    bar(p, 500, 640, 375, 380, 64, 62);
    bar(p, 375, 380, 610, 200, 60, 62, 52);
    p.circle(500, 640, 62);
    p.circle(500, 640, 24);
    p.circle(375, 380, 62);
    p.circle(375, 380, 24);
    p.circle(610, 200, 52);
    p.circle(610, 200, 20);
    p.roundRect(662, 150, 110, 100, 35);
    p.star(870, 160, 70, 31, 5);
    cloud(p, 80, 330, 0.9);
    p.heart(850, 640, 140);
  }),
  // 11 balloons
  page('robots', 11, (p) => {
    p.ellipse(290, 170, 105, 125);
    p.ellipse(510, 140, 105, 125);
    p.ellipse(730, 190, 105, 125);
    p.path('M290 295 L450 500');
    p.path('M510 265 L500 500');
    p.path('M730 315 L560 500');
    p.roundRect(375, 480, 250, 190, 60);
    eye(p, 445, 560, 32);
    eye(p, 555, 560, 32);
    smile(p, 500, 620, 30, 0.4);
    p.roundRect(335, 680, 330, 160, 50);
    p.circle(500, 760, 30);
    p.roundRect(385, 840, 80, 80, 24);
    p.roundRect(535, 840, 80, 80, 24);
    p.roundRect(225, 700, 110, 45, 22);
    p.roundRect(665, 700, 110, 45, 22);
  }),
  // 12 blocks
  page('robots', 12, (p) => {
    p.roundRect(300, 70, 200, 180, 55);
    eye(p, 365, 150, 26);
    eye(p, 435, 150, 26);
    p.rect(370, 250, 60, 30);
    p.roundRect(250, 280, 300, 240, 50);
    p.circle(400, 400, 38);
    p.roundRect(145, 300, 105, 45, 22);
    p.roundRect(550, 300, 105, 45, 22);
    p.roundRect(290, 520, 90, 220, 28);
    p.roundRect(420, 520, 90, 220, 28);
    p.rect(640, 700, 280, 220);
    p.circle(780, 810, 60);
    p.rect(680, 500, 200, 200);
    p.star(780, 600, 70, 32, 5);
    p.rect(80, 780, 200, 140);
    p.poly([
      [280, 780],
      [180, 680],
      [80, 780],
    ]);
    p.rect(300, 820, 100, 100);
  }),
  // 13 vacuum
  page('robots', 13, (p) => {
    p.circle(500, 500, 400);
    p.circle(500, 500, 330);
    eye(p, 400, 440, 55);
    eye(p, 600, 440, 55);
    smile(p, 500, 560, 80, 0.45);
    p.circle(500, 190, 45);
    p.circle(500, 190, 16);
    p.circle(260, 740, 45);
    p.circle(740, 740, 45);
    p.star(130, 130, 50, 22, 4);
    p.star(870, 140, 45, 20, 4);
    p.star(900, 870, 45, 20, 4);
  }),
  // 14 giant robot + city
  page('robots', 14, (p) => {
    p.roundRect(380, 60, 240, 190, 60);
    eye(p, 445, 140, 28);
    eye(p, 555, 140, 28);
    smile(p, 500, 205, 30, 0.35);
    p.rect(455, 250, 90, 35);
    p.roundRect(330, 285, 340, 320, 55);
    p.roundRect(410, 340, 180, 110, 28);
    p.heart(500, 395, 60);
    p.roundRect(190, 300, 140, 70, 30);
    p.roundRect(670, 300, 140, 70, 30);
    p.circle(150, 335, 42);
    p.circle(850, 335, 42);
    p.rect(60, 650, 200, 270);
    p.rect(280, 600, 160, 320);
    p.rect(560, 640, 160, 280);
    p.rect(740, 560, 200, 360);
    [
      [110, 700],
      [180, 700],
      [110, 790],
      [180, 790],
      [310, 650],
      [370, 650],
      [310, 750],
      [370, 750],
      [590, 690],
      [650, 690],
      [590, 790],
      [650, 790],
      [780, 610],
      [850, 610],
      [780, 710],
      [850, 710],
    ].forEach(([x, y]) => p.rect(x!, y!, 45, 45));
    p.roundRect(450, 650, 100, 270, 20);
  }),
  // 15 spider robot
  page('robots', 15, (p) => {
    const leg = (x1: number, y1: number, x2: number, y2: number): void => {
      const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      const dx = 22 * Math.cos(a);
      const dy = 22 * Math.sin(a);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ex = x2 - ((x2 - x1) / len) * 40;
      const ey = y2 - ((y2 - y1) / len) * 40;
      p.poly([
        [x1 + dx, y1 + dy],
        [ex + dx, ey + dy],
        [ex - dx, ey - dy],
        [x1 - dx, y1 - dy],
      ]);
      p.circle(x2, y2, 45);
    };
    leg(350, 498, 140, 380);
    leg(312, 590, 100, 610);
    leg(350, 682, 160, 840);
    leg(650, 498, 860, 380);
    leg(688, 590, 900, 610);
    leg(650, 682, 840, 840);
    p.ellipse(500, 590, 190, 150);
    p.circle(500, 340, 150);
    eye(p, 440, 320, 38);
    eye(p, 560, 320, 38);
    smile(p, 500, 400, 40, 0.4);
    p.line(500, 190, 500, 135);
    p.circle(500, 110, 28);
    p.circle(500, 620, 40);
    p.circle(500, 620, 15);
  }),
];
