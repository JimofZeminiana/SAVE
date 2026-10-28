// Figure "segnale", wrapped in a block so figures can share a page as classic scripts.
{
/**
 * Segnale: the Signal for Help, a hand facing the viewer, palm open. On its own
 * loop the thumb folds into the palm, then the four fingers close over it, one
 * after the other: the moving part takes the bright stroke. It holds closed,
 * opens again, slower, and starts over. The slider is the length of the hold, in ms.
 *
 * The pattern: an ambient figure, drawn flat and head-on, as the gesture is
 * meant to be seen. Nothing answers the pointer; under reduced motion it stops
 * on the closed hand. It reads out the step it is on: "1", "2" or "3".
 */
const { EASE_LIFT, clamp, lerp, mk, rad, register, disposer, pointer, reducedMotion } = HL;

// Right hand, palm towards the viewer: the thumb is on the viewer's left.
// Fingers, index to little: centre x, knuckle y, length.
const FINGERS = [[178, 146, 74], [201, 141, 84], [224, 144, 78], [246, 153, 60]];
const FR = 10.5;
const PALM = { x0: 162, y0: 138, x1: 258, y1: 240, r: 24 };
// Tucked, the thumb lies low enough to show under the closed fingers, as in the real gesture
const THUMB = { base: [170, 220], r: 11, out: { a: -118, len: 64 }, in: { a: -4, len: 54 } };
// Folded, a finger's tip comes this far below its knuckle, over the thumb
const FOLD = 0.85;
// Seconds: open, thumb in, fingers in, (hold), fingers out, thumb out, rest
const OPEN = 1.1, THUMB_IN = 0.7, GAP = 0.25, FINGER = 0.55, STAGGER = 0.09, OUT_F = 0.8, OUT_T = 0.6, REST = 0.7;

const f2 = (n) => Math.round(n * 100) / 100;

/** A finger or a thumb: a capsule from a to b, r wide on each side. */
function capsule(a, b, r) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 0.001;
  const nx = (-dy / len) * r, ny = (dx / len) * r;
  return `M${f2(a[0] + nx)},${f2(a[1] + ny)}L${f2(b[0] + nx)},${f2(b[1] + ny)}`
    + `A${r},${r} 0 0 0 ${f2(b[0] - nx)},${f2(b[1] - ny)}`
    + `L${f2(a[0] - nx)},${f2(a[1] - ny)}A${r},${r} 0 0 0 ${f2(a[0] + nx)},${f2(a[1] + ny)}Z`;
}

function roundRect({ x0, y0, x1, y1, r }) {
  return `M${x0 + r},${y0}H${x1 - r}A${r},${r} 0 0 1 ${x1},${y0 + r}V${y1 - r}A${r},${r} 0 0 1 ${x1 - r},${y1}`
    + `H${x0 + r}A${r},${r} 0 0 1 ${x0},${y1 - r}V${y0 + r}A${r},${r} 0 0 1 ${x0 + r},${y0}Z`;
}

/** How far a move that starts at t0 and lasts d has gone, eased. */
const phase = (t, t0, d) => EASE_LIFT(clamp((t - t0) / d, 0, 1));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hold = value / 1000;

  const g = mk('g', {}, svg);
  // painted back to front: wrist, what sits behind the palm, palm, what lies over it
  mk('path', { d: 'M184,232V306M236,232V306', class: 'sil nf' }, g);
  const back = mk('g', {}, g);
  mk('path', { d: roundRect(PALM), class: 'sil' }, g);
  mk('path', { d: 'M186,236C176,214 180,190 196,176', class: 'nf lo' }, g);
  mk('path', { d: 'M210,226C222,214 238,208 250,208', class: 'nf lo' }, g);
  const front = mk('g', {}, g);

  const thumb = mk('path', { class: 'sil' }, back);
  const fingers = FINGERS.map(() => mk('path', { class: 'sil' }, back));

  const times = () => {
    const thumbIn = OPEN, fingersIn = thumbIn + THUMB_IN + GAP;
    const closed = fingersIn + FINGER + STAGGER * 3;
    const fingersOut = closed + hold, thumbOut = fingersOut + OUT_F + STAGGER * 3;
    return { thumbIn, fingersIn, closed, fingersOut, thumbOut, loop: thumbOut + OUT_T + REST };
  };

  let last = '';
  function draw(t) {
    const T = times();
    const tp = phase(t, T.thumbIn, THUMB_IN) - phase(t, T.thumbOut, OUT_T);
    const fp = FINGERS.map((_, i) => phase(t, T.fingersIn + i * STAGGER, FINGER) - phase(t, T.fingersOut + (3 - i) * STAGGER, OUT_F));
    const key = [tp, ...fp].map((n) => n.toFixed(3)).join();
    if (key === last) return;
    last = key;

    // the thumb swings from out to the left to across the palm
    const a = rad(lerp(THUMB.out.a, THUMB.in.a, tp)), len = lerp(THUMB.out.len, THUMB.in.len, tp);
    const tip = [THUMB.base[0] + len * Math.cos(a), THUMB.base[1] + len * Math.sin(a)];
    thumb.setAttribute('d', capsule(THUMB.base, tip, THUMB.r));
    if ((tp > 0.3) !== (thumb.parentNode === front)) (tp > 0.3 ? front : back).prepend(thumb);
    const thumbMoving = tp > 0.02 && tp < 0.98;
    thumb.setAttribute('class', thumbMoving ? 'sil hi' : 'sil');

    // each finger tips over its knuckle and comes down across the palm
    fingers.forEach((el, i) => {
      const [x, ky, L] = FINGERS[i], f = fp[i];
      const tipY = ky - L + f * (1 + FOLD) * L;
      const folded = f > 0.5;
      el.setAttribute('d', capsule([x, folded ? ky - 3 : ky + 16], [x, tipY], FR));
      if (folded !== (el.parentNode === front)) (folded ? front : back).appendChild(el);
      el.setAttribute('class', f > 0.02 && f < 0.98 ? 'sil hi' : 'sil');
    });

    const fingersOn = fp.some((f) => f > 0.02);
    read.textContent = fingersOn ? '3' : tp > 0.02 ? '2' : '1';
  }

  const t0 = performance.now();
  const Bk = register(stage, (_dt, now) => {
    if (reducedMotion()) { draw(times().closed + 0.1); return false; }
    draw(((now - t0) / 1000) % times().loop);
    return true;
  });
  bag.add(Bk.unregister);
  // the loop plays on its own: the pointer is heard, and changes nothing
  bag.add(pointer(stage, { move: () => {}, leave: () => {} }));
  bag.add(() => svg.replaceChildren());
  draw(0);

  return {
    set: (v) => { hold = v / 1000; Bk.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: 'segnale',
  means: 'Una mano con il palmo verso chi guarda piega il pollice nel palmo, poi chiude le dita sopra il pollice: il segnale per chiedere aiuto.',
  rules: [4, 5, 7, 9],
  range: [2600, 1800, 1000],
  mount,
});
}
