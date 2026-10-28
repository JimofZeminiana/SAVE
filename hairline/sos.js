// Figure "sos" (from sos.js), wrapped in a block so figures can share a page as classic scripts.
{
/**
 * SOS: a phone standing, leaning back a little, its side button bright. On its own loop the
 * button is pressed five times, fast; each press sinks it and lights one of
 * five dots on the screen. Then the screen answers with a handset that grows in
 * the middle and rings that keep spreading from it: the emergency call. It
 * holds, goes back to the lock screen, and starts again. The slider is the time
 * between two presses, in ms.
 *
 * The pattern: an ambient figure. Nothing answers the pointer; the one clock
 * is the loop's own time inside register, and under reduced motion it stops
 * on the call.
 */
const {
  Cam, EASE_LIFT, clamp, fillet, fit, hull, open, poly, proj, rad, rrect, run,
  disposer, mk, place, pointer, register, reducedMotion,
} = HL;

const W = 58, H = 124, T = 6.5, R = 11, B = 1.2;              // the phone, in its own u (across), v (up), w (out of the screen)
const BV0 = H * 0.64, BV1 = H * 0.77;                           // the side button, a quarter down the right edge
const HC = [W / 2 + 3, H * 0.5 + 3];                            // the handset's arc centre
const IDLE = 1.2, LEAD = 0.35, CALL = 3.4, OUT = 0.5, TAIL = 0.8;

const BACK = rad(15);
const eu = [1, 0, 0], ev = [0, -Math.sin(BACK), Math.cos(BACK)], eo = [0, Math.cos(BACK), Math.sin(BACK)];
/** Phone coordinates to world: the phone stands screen to the near left, leaning back 15°, its button on the near right side. */
const L = (u, v, w) => [0, 1, 2].map((k) => u * eu[k] + v * ev[k] + w * eo[k]);

/** One quick press: how far down the button is, d seconds after it starts. */
function depth(d) {
  if (d < 0 || d > 0.2) return 0;
  if (d < 0.06) return EASE_LIFT(d / 0.06);
  return d < 0.1 ? 1 : 1 - EASE_LIFT((d - 0.1) / 0.1);
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value / 1000;

  const C = Cam(45, 0.5, 2);
  const pts = [];
  for (const u of [0, W + 2]) for (const v of [0, H]) for (const w of [0, T]) pts.push(L(u, v, w));
  fit(C, pts, 200, 166);
  const P = proj(C), Q = (u, v, w) => P(...L(u, v, w));

  // the view direction and the screen scale, read off the projection
  const o = P(0, 0, 0), ax = [P(1, 0, 0), P(0, 1, 0), P(0, 0, 1)].map((q) => [q[0] - o[0], q[1] - o[1]]);
  let V = [ax[1][0] * ax[2][1] - ax[2][0] * ax[1][1], ax[2][0] * ax[0][1] - ax[0][0] * ax[2][1], ax[0][0] * ax[1][1] - ax[1][0] * ax[0][1]];
  if (V[2] < 0) V = V.map((x) => -x);
  const sideFaces = (q) => [0, 1, 2].reduce((s, k) => s + (q.nu * eu[k] + q.nv * ev[k]) * V[k], 0) > 0;

  const at = (ring, w, du = 0, dv = 0) => ring.map((q) => Q(q.u + du, q.v + dv, w));
  /** A slab parallel to the screen: silhouette from both faces, crease on the near face where a side shows. */
  const slab = (ring, inner, w0, w1) => ({ sil: poly(hull(at(ring, w0).concat(at(ring, w1)))), crease: open(at(run(inner, sideFaces), w1)) });
  const circle = (cu, cv, r) => poly(Array.from({ length: 33 }, (_, j) => Q(cu + r * Math.cos(j * Math.PI / 16), cv + r * Math.sin(j * Math.PI / 16), T)));

  const g = mk("g", {}, svg);
  // the phone
  const body = slab(rrect(0, 0, W, H, R, 14), rrect(B, B, W - B, H - B, R - B, 14), 0, T);
  mk("path", { d: body.sil, class: "sil" }, g);
  mk("path", { d: body.crease, class: "nf lo" }, g);
  const btn = mk("path", { class: "sil hi" }, g);
  mk("path", { d: poly(at(rrect(3.2, 3.2, W - 3.2, H - 3.2, R - 3, 14), T)), class: "nf lo" }, g);
  mk("path", { d: poly(at(rrect(W / 2 - 7, H - 10.5, W / 2 + 7, H - 6, 2.2, 4), T)), class: "nf" }, g);
  const dots = [0, 1, 2, 3, 4].map((i) => {
    const el = mk("circle", { r: 1.6, class: "dot off" }, g);
    place(el, Q(W / 2 + (i - 2) * 6.5, H * 0.8, T));
    return el;
  });
  const rings = [0, 1].map(() => mk("path", { class: "nf lo" }, g));
  const handset = mk("path", { class: "nf hi" }, g);

  /** The handset, grown to s of its size: a thick bowl from the upper left round to the lower right. */
  function phoneMark(s) {
    if (s < 0.04) return "";
    const outer = [], inner = [];
    for (let j = 0; j <= 10; j++) {
      const end = j < 3 || j > 7, a = rad(125 + 200 * j / 10), ro = end ? 11.8 : 9.4, ri = end ? 3.2 : 6.6;
      outer.push([HC[0] + ro * s * Math.cos(a), HC[1] + ro * s * Math.sin(a)]);
      inner.push([HC[0] + ri * s * Math.cos(a), HC[1] + ri * s * Math.sin(a)]);
    }
    const ring = outer.concat(inner.reverse());
    return poly(fillet(ring, ring.map(() => 2 * s), 3).map(([u, v]) => Q(u, v, T)));
  }

  let last = "";
  function draw(t) {
    const press = [0, 1, 2, 3, 4].map((i) => IDLE + i * gap);
    const callAt = press[4] + LEAD, d = press.reduce((m, p) => Math.max(m, depth(t - p)), 0);
    const ct = t - callAt, inCall = ct >= 0 && ct < CALL + OUT;
    const count = ct >= CALL ? 0 : press.filter((p) => t >= p).length;
    const s = !inCall ? 0 : ct < 0.7 ? EASE_LIFT(ct / 0.7) : ct < CALL ? 1 : 1 - EASE_LIFT(clamp((ct - CALL) / OUT, 0, 1));
    const key = [d.toFixed(3), count, s.toFixed(3), inCall && s > 0.9 ? ct.toFixed(3) : ""].join();
    if (key === last) return;
    last = key;

    const [u0, u1] = [W - 0.5, W + 1.9 - 1.5 * d], kr = rrect(u0, 1.4, u1, T - 1.4, 0.9, 4);
    btn.setAttribute("d", poly(hull(kr.map((q) => Q(q.u, BV0, q.v)).concat(kr.map((q) => Q(q.u, BV1, q.v))))));
    btn.classList.toggle("hi", s === 0);
    dots.forEach((el, i) => el.setAttribute("class", i < count ? "dot m" : "dot off"));
    handset.setAttribute("d", phoneMark(s));
    rings.forEach((el, j) => {
      const k = ((ct / 1.4) + j / 2) % 1;
      el.setAttribute("d", s > 0.9 ? circle(HC[0] - 3, HC[1] - 3, 15 + 11 * EASE_LIFT(k)) : "");
    });
    read.textContent = s > 0.5 ? "chiamata d'emergenza" : count ? "pressione " + count : "rest";
  }

  const t0 = performance.now();
  const loop = () => IDLE + 4 * gap + LEAD + CALL + OUT + TAIL;
  const Bk = register(stage, (_dt, now) => {
    if (reducedMotion()) { draw(IDLE + 4 * gap + LEAD + 1.5); return false; }
    draw(((now - t0) / 1000) % loop());
    return true;
  });
  bag.add(Bk.unregister);
  // the loop plays on its own: the pointer is heard, and changes nothing
  bag.add(pointer(stage, { move: () => {}, leave: () => {} }));
  bag.add(() => svg.replaceChildren());
  draw(0);

  return {
    set: (v) => { gap = v / 1000; Bk.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "sos",
  means: "Cinque pressioni veloci del tasto laterale: lo schermo risponde con la chiamata d'emergenza.",
  rules: [4, 5, 7, 9],
  range: [420, 300, 180],
  tour: [[200, 120], [250, 170], [170, 210], null],
  mount,
});
}
