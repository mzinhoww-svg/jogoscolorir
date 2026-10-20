import { page } from '../dsl';
import type { PageDef } from '../types';

export const pages: PageDef[] = [
  page('animals', 1, 'cat', (p) => {
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
  page('animals', 2, 'fish', (p) => {
    p.ellipse(420, 500, 310, 200); // body
    p.poly([
      [690, 500],
      [900, 320],
      [900, 680],
    ]); // tail
    p.poly([
      [300, 320],
      [400, 160],
      [560, 330],
    ]); // top fin
    p.poly([
      [380, 680],
      [450, 790],
      [540, 670],
    ]); // bottom fin
    p.circle(250, 450, 55); // eye
    p.circle(262, 452, 22); // pupil
    p.path('M360 360 Q420 500 360 640'); // gill
    p.circle(470, 480, 55); // scales
    p.circle(570, 540, 55);
    p.circle(480, 590, 40);
    p.path('M130 560 Q175 590 215 565'); // smile
    p.circle(110, 330, 38); // bubbles
    p.circle(70, 230, 26);
    p.circle(150, 150, 18);
  }),
];
