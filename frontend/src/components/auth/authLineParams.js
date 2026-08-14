const rand = (min, max) => min + Math.random() * (max - min);

export const LINE_WHITE = '255 255 255';
export const LINE_RED = '238 43 72';
const RED_SHARE = 0.35;

export function lineParams(viewportWidth, viewportHeight, random = rand) {
  const len = random(70, 1520);
  const diagonal = Math.hypot(viewportWidth, viewportHeight);
  const travel = ((diagonal + len * 2) / len) * 100;

  return {
    len,
    travel,
    angle: random(0, 360),
    thickness: random(1, 5),
    peak: random(0.2, 0.85),
    duration: random(20, 25),
    top: random(-15, 115),
    left: random(-15, 115),
    rgb: random(0, 1) < RED_SHARE ? LINE_RED : LINE_WHITE,
  };
}
