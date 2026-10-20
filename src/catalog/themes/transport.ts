import { page } from '../dsl';
import type { PageDef, Pen } from '../types';

/*
 * Transport theme — 15 distinct subjects:
 *  1 car             2 school bus       3 fire truck       4 airplane          5 sailboat
 *  6 steam train     7 bicycle          8 helicopter       9 tractor          10 dump truck
 * 11 hot-air balloon 12 submarine      13 ambulance       14 motorbike        15 tugboat
 */

const ey = (cx: number, cy: number, rx: number, ry: number, x: number, sign: 1 | -1) =>
  cy + sign * ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));

const star4 = (p: Pen, x: number, y: number, r: number) => p.star(x, y, r, r * 0.38, 4);

const bar = (p: Pen, x1: number, y1: number, x2: number, y2: number, w: number) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = (-Math.sin(a) * w) / 2;
  const ny = (Math.cos(a) * w) / 2;
  p.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
};

const smile = (p: Pen, x: number, y: number, w: number, d: number) =>
  p.path(`M${x - w} ${y} Q${x} ${y + d} ${x + w} ${y}`);

const wheel = (p: Pen, x: number, y: number, r: number, hub = r * 0.42) => {
  p.circle(x, y, r);
  p.circle(x, y, hub);
};

/** Vehicle body with rounded corners and half-circle wheel arches cut into the bottom edge. */
const chassis = (
  p: Pen,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  arches: number[],
  ar: number,
) => {
  let d = `M${x0} ${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} L${x1 - r} ${y0} Q${x1} ${y0} ${x1} ${y0 + r} L${x1} ${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1}`;
  for (const cx of [...arches].sort((a, b) => b - a)) d += ` L${cx + ar} ${y1} A${ar} ${ar} 0 0 0 ${cx - ar} ${y1}`;
  d += ` L${x0 + r} ${y1} Q${x0} ${y1} ${x0} ${y1 - r} Z`;
  p.path(d);
};

const cloud = (p: Pen, x: number, y: number, s = 1) => {
  p.path(
    `M${x} ${y} Q${x - 50 * s} ${y} ${x - 50 * s} ${y - 35 * s} Q${x - 50 * s} ${y - 75 * s} ${x - 5 * s} ${y - 70 * s} Q${x + 10 * s} ${y - 115 * s} ${x + 55 * s} ${y - 85 * s} Q${x + 100 * s} ${y - 95 * s} ${x + 100 * s} ${y - 45 * s} Q${x + 130 * s} ${y - 35 * s} ${x + 100 * s} ${y} Z`,
  );
};

export const pages: PageDef[] = [
  // 1 — Car
  page('transport', 1, (p) => {
    chassis(p, 100, 470, 900, 700, 70, [280, 720], 118);
    p.path('M290 470 L370 310 Q380 290 410 290 L610 290 Q640 290 655 310 L740 470'); // cabin
    p.path('M335 450 L395 328 L490 328 L490 450 Z'); // windows
    p.path('M525 450 L525 328 L600 328 L695 450 Z');
    wheel(p, 280, 700, 88);
    wheel(p, 720, 700, 88);
    p.circle(850, 560, 30); // headlight
    cloud(p, 250, 200, 1);
    p.circle(800, 160, 60); // sun
    p.line(800, 60, 800, 40);
    smile(p, 600, 570, 60, 36);
  }),
  // 2 — School bus
  page('transport', 2, (p) => {
    chassis(p, 70, 270, 930, 700, 60, [270, 730], 118);
    for (const x of [115, 255, 395, 535]) p.roundRect(x, 330, 110, 130, 14);
    p.path('M690 330 L790 330 Q830 330 850 390 L880 460 L690 460 Z'); // windshield
    p.line(70, 540, 930, 540); // stripe
    p.line(70, 580, 930, 580);
    p.circle(885, 620, 30); // headlight
    p.line(660, 330, 660, 540); // door line
    wheel(p, 270, 700, 88);
    wheel(p, 730, 700, 88);
    cloud(p, 260, 200, 0.9);
    p.circle(820, 150, 55);
  }),
  // 3 — Fire truck
  page('transport', 3, (p) => {
    chassis(p, 60, 430, 940, 700, 40, [250, 740], 115);
    p.path('M640 430 L690 310 L850 310 L900 430'); // cab
    p.path('M690 420 L720 340 L830 340 L860 420 Z'); // window
    p.roundRect(110, 360, 480, 55, 10); // ladder
    for (const x of [170, 230, 290, 350, 410, 470, 530]) p.line(x, 360, x, 415);
    p.roundRect(100, 470, 160, 70, 14); // doors
    p.roundRect(400, 470, 200, 100, 14);
    p.roundRect(740, 245, 70, 65, 20); // siren
    p.circle(905, 540, 26);
    wheel(p, 250, 700, 85);
    wheel(p, 740, 700, 85);
    p.circle(500, 190, 70); // smoke/sun
    p.star(150, 200, 55, 24, 5);
  }),
  // 4 — Airplane
  page('transport', 4, (p) => {
    const C = [480, 500, 400, 105] as const;
    p.ellipse(...C); // fuselage
    p.path(`M140 ${ey(...C, 140, -1)} L80 250 L190 250 L290 ${ey(...C, 290, -1)}`); // tail fin
    p.path(`M200 ${ey(...C, 200, 1)} L130 650 L230 650 L300 ${ey(...C, 300, 1)}`); // stabilizer
    p.path(`M520 ${ey(...C, 520, 1)} L360 800 L480 800 L680 ${ey(...C, 680, 1)}`); // wing
    p.ellipse(430, 735, 70, 34); // engine
    for (const x of [230, 320, 410, 500, 590]) p.circle(x, 500, 22);
    p.path('M690 480 Q750 455 805 485 L805 525 L690 525 Z'); // cockpit window
    p.ellipse(930, 500, 16, 85); // propeller
    cloud(p, 200, 200, 1);
    cloud(p, 800, 300, 0.9);
    cloud(p, 860, 850, 0.9);
    cloud(p, 120, 880, 0.8);
  }),
  // 5 — Sailboat
  page('transport', 5, (p) => {
    p.path('M130 650 L870 650 Q800 800 660 800 L340 800 Q200 800 130 650 Z'); // hull
    p.line(500, 130, 500, 650); // mast
    p.poly([
      [500, 170],
      [500, 610],
      [230, 610],
    ]); // sails
    p.poly([
      [500, 250],
      [500, 610],
      [780, 610],
    ]);
    p.poly([
      [500, 80],
      [620, 125],
      [500, 170],
    ]); // flag
    p.circle(330, 720, 30);
    p.circle(500, 720, 30);
    p.circle(670, 720, 30);
    p.path('M60 870 Q130 820 200 870 T340 870 T480 870 T620 870 T760 870 T900 870'); // waves
    p.path('M120 950 Q190 900 260 950 T400 950 T540 950 T680 950 T820 950');
    p.circle(170, 200, 80); // sun
    p.circle(850, 190, 40);
    cloud(p, 800, 400, 0.8);
  }),
  // 6 — Steam train
  page('transport', 6, (p) => {
    chassis(p, 100, 430, 860, 700, 30, [220, 440, 670], 92);
    p.rect(110, 290, 220, 140); // cab
    p.rect(150, 330, 140, 70); // cab window
    p.rect(90, 250, 260, 40); // roof
    p.poly([
      [700, 430],
      [690, 330],
      [770, 330],
      [760, 430],
    ]); // chimney
    p.rect(655, 290, 150, 40);
    p.path('M460 430 Q510 340 560 430'); // dome
    p.circle(835, 500, 30); // lamp
    p.poly([
      [860, 600],
      [950, 700],
      [860, 700],
    ]); // cowcatcher
    wheel(p, 220, 700, 78, 30);
    wheel(p, 440, 700, 78, 30);
    wheel(p, 670, 700, 78, 30);
    p.circle(700, 200, 50); // smoke
    p.circle(790, 140, 42);
    smile(p, 600, 540, 60, 34);
  }),
  // 7 — Bicycle
  page('transport', 7, (p) => {
    for (const cx of [240, 760]) {
      p.circle(cx, 650, 175); // tyre
      p.circle(cx, 650, 135);
      p.circle(cx, 650, 30); // hub
      p.line(cx - 135, 650, cx + 135, 650); // spokes
      p.line(cx, 515, cx, 785);
    }
    p.line(240, 650, 420, 430); // frame
    p.line(420, 430, 640, 430);
    p.line(640, 430, 490, 660);
    p.line(240, 650, 490, 660);
    p.line(420, 430, 490, 660);
    p.line(640, 430, 760, 650); // fork
    p.line(640, 430, 625, 330); // handlebar post
    p.line(580, 320, 700, 330);
    p.line(420, 430, 410, 385);
    p.ellipse(410, 365, 85, 30); // seat
    p.circle(490, 660, 52); // chain ring
    p.circle(490, 660, 20);
    p.circle(740, 320, 30); // bell
    cloud(p, 250, 230, 1);
    p.circle(850, 130, 60);
  }),
  // 8 — Helicopter
  page('transport', 8, (p) => {
    const C = [470, 560, 270, 175] as const;
    p.ellipse(...C); // cabin
    p.path('M207 520 L90 500 L90 580 L207 600'); // tail boom
    p.path('M115 505 L80 380 L150 380 L185 512'); // tail fin
    p.line(470, 385, 470, 330); // mast
    p.ellipse(470, 315, 360, 26); // rotor
    p.roundRect(520, 470, 170, 120, 45); // window
    p.roundRect(340, 480, 140, 100, 25); // door window
    smile(p, 560, 640, 60, 30);
    p.line(260, 770, 720, 770); // skids
    p.line(380, 725, 370, 770);
    p.line(600, 720, 610, 770);
    cloud(p, 200, 200, 0.9);
    cloud(p, 800, 880, 1);
    p.circle(840, 190, 60);
  }),
  // 9 — Tractor
  page('transport', 9, (p) => {
    p.path(
      'M100 290 Q100 270 120 270 L460 270 Q480 270 480 290 L480 450 L880 450 Q900 450 900 470 L900 640 L842 640 A112 112 0 0 0 618 640 L520 640 A190 190 0 0 0 140 640 L120 640 Q100 640 100 620 Z',
    );
    p.roundRect(160, 305, 260, 110, 18); // cab window
    p.rect(760, 340, 46, 110); // chimney
    p.circle(880, 530, 26); // headlight
    p.line(560, 500, 560, 580); // vents
    p.line(620, 500, 620, 540);
    wheel(p, 330, 640, 158, 70);
    p.circle(330, 640, 24);
    wheel(p, 730, 640, 85, 34);
    p.path('M60 800 Q250 760 500 800 T940 800 L940 940 L60 940 Z'); // field
    p.line(200, 860, 300, 860);
    p.line(480, 890, 600, 890);
    p.circle(800, 160, 70);
  }),
  // 10 — Dump truck
  page('transport', 10, (p) => {
    chassis(p, 70, 520, 930, 700, 30, [250, 740], 110);
    p.path('M640 520 L640 360 L800 360 L930 470 L930 520'); // cab
    p.path('M672 495 L672 392 L780 392 L860 495 Z'); // window
    p.roundRect(80, 340, 520, 180, 20); // bed
    p.line(210, 340, 210, 520); // ribs
    p.line(340, 340, 340, 520);
    p.line(470, 340, 470, 520);
    p.path('M130 340 Q340 190 550 340'); // sand pile
    p.circle(260, 270, 28);
    p.circle(420, 280, 24);
    wheel(p, 250, 700, 82);
    wheel(p, 740, 700, 82);
    p.circle(900, 575, 24);
    cloud(p, 820, 200, 0.9);
  }),
  // 11 — Hot-air balloon
  page('transport', 11, (p) => {
    p.path(
      'M230 360 Q230 70 500 70 Q770 70 770 360 Q770 480 600 610 L400 610 Q230 480 230 360 Z',
    );
    p.path('M500 70 Q330 330 430 610'); // gores
    p.path('M500 70 Q670 330 570 610');
    p.heart(500, 360, 110);
    p.roundRect(410, 730, 180, 140, 20); // basket
    p.line(430, 730, 405, 610); // ropes
    p.line(570, 730, 595, 610);
    p.line(410, 800, 590, 800);
    cloud(p, 190, 880, 1);
    cloud(p, 850, 760, 0.9);
    p.circle(130, 170, 50);
    p.circle(880, 160, 36);
  }),
  // 12 — Submarine
  page('transport', 12, (p) => {
    const C = [500, 540, 380, 175] as const;
    p.ellipse(...C);
    p.path(`M455 ${ey(...C, 455, -1)} L455 250 Q455 220 485 220 L585 220 L585 265 L505 265 L505 ${ey(...C, 505, -1)}`); // periscope
    for (const x of [380, 520, 660]) p.circle(x, 540, 55);
    p.path(`M175 ${ey(...C, 175, -1)} L80 410 L80 480 L140 ${ey(...C, 140, -1) + 30}`); // tail fin
    p.path(`M170 ${ey(...C, 170, 1)} L80 670 L80 610 L140 ${ey(...C, 140, 1) - 30}`);
    p.ellipse(60, 545, 24, 80); // propeller
    smile(p, 830, 600, 40, 30);
    p.circle(880, 400, 30); // bubbles
    p.circle(930, 320, 22);
    p.circle(850, 250, 18);
    p.path('M40 820 Q110 770 180 820 T320 820 T460 820 T600 820 T740 820 T880 820 T960 820');
    p.path('M60 920 Q130 870 200 920 T340 920 T480 920 T620 920 T760 920 T900 920');
  }),
  // 13 — Ambulance
  page('transport', 13, (p) => {
    chassis(p, 70, 310, 930, 700, 50, [260, 740], 115);
    p.path('M660 310 L660 470 L890 470 L810 340 Q790 310 760 310 Z'); // windshield
    p.poly([
      [250, 380],
      [310, 380],
      [310, 440],
      [370, 440],
      [370, 500],
      [310, 500],
      [310, 560],
      [250, 560],
      [250, 500],
      [190, 500],
      [190, 440],
      [250, 440],
    ]); // cross
    p.roundRect(400, 220, 130, 60, 26); // siren
    p.line(465, 280, 465, 310);
    p.line(470, 180, 470, 150);
    p.line(540, 205, 570, 180);
    p.line(400, 205, 370, 180);
    p.line(590, 310, 590, 600);
    p.circle(900, 600, 24);
    wheel(p, 260, 700, 88);
    wheel(p, 740, 700, 88);
    p.heart(500, 470, 100);
  }),
  // 14 — Kick scooter
  page('transport', 14, (p) => {
    p.roundRect(170, 690, 640, 56, 28); // deck
    wheel(p, 200, 810, 80, 30);
    wheel(p, 810, 810, 80, 30);
    bar(p, 750, 700, 700, 250, 44);
    p.roundRect(540, 170, 320, 60, 30); // handlebar
    p.circle(545, 200, 36); // grips
    p.circle(855, 200, 36);
    p.heart(400, 718, 36);
    cloud(p, 250, 330, 1);
    star4(p, 120, 120, 45);
    star4(p, 880, 560, 40);
  }),
  // 15 — Tugboat
  page('transport', 15, (p) => {
    p.path('M70 540 L930 540 Q880 760 730 760 L270 760 Q120 760 70 540 Z'); // hull
    p.roundRect(350, 370, 320, 170, 20); // wheelhouse
    p.rect(330, 330, 360, 40); // roof
    p.rect(420, 180, 110, 150); // funnel
    p.line(420, 230, 530, 230);
    p.roundRect(390, 405, 90, 80, 12); // windows
    p.roundRect(540, 405, 90, 80, 12);
    p.circle(200, 640, 36); // portholes
    p.circle(500, 650, 36);
    p.circle(800, 640, 36);
    p.circle(800, 470, 52); // life ring
    p.circle(800, 470, 20);
    p.circle(580, 110, 46); // smoke
    p.path('M30 850 Q100 800 170 850 T310 850 T450 850 T590 850 T730 850 T870 850 T980 850');
    p.path('M60 940 Q130 890 200 940 T340 940 T480 940 T620 940 T760 940 T900 940');
  }),
];
