// Records short scripted interactions with SAVE pages as JPEG sprite strips.
// Usage: node record.mjs <outDir> [sceneKey...]
// Needs the site on http://localhost:8765 and Google Chrome installed.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { scenes } from './scenes.mjs';

const OUT = process.argv[2];
const only = process.argv.slice(3);
const BASE = 'http://localhost:8765/';
const PORT = 9333;
const W = 1280, H = 800;
const SNAP_W = 432; // output frame width, height follows 16:10
mkdirSync(OUT, { recursive: true });

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TMPDIR}/save-rec-profile`,
  `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--force-device-scale-factor=1', 'about:blank'
], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());

let ws, id = 0;
const pending = new Map();
const listeners = [];
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        ws.onmessage = e => {
          const msg = JSON.parse(e.data);
          if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
          else listeners.forEach(fn => fn(msg));
        };
        return;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, msg => msg.error ? rej(new Error(method + ': ' + msg.error.message)) : res(msg.result));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
function waitLoad() {
  return new Promise(res => {
    const fn = msg => { if (msg.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(fn), 1); res(); } };
    listeners.push(fn);
  });
}

// Helpers installed in every page: a visible pointer, scrolling, clicking, typing
const helpers = `
(() => {
  sessionStorage.setItem('save-safety-notice', 'seen');
  const css = document.createElement('style');
  css.textContent = '.site-header{display:none!important}:root{--header-h:0px}.sn-dialog{display:none!important}*{scroll-behavior:auto!important;caret-color:transparent}'
    + '#rec-pointer{position:fixed;z-index:99999;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(142,65,133,.35);border:2px solid #8e4185;pointer-events:none;transition:transform .12s}'
    + '#rec-pointer.down{transform:scale(.7)}';
  document.head.appendChild(css);
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  const p = document.createElement('div'); p.id = 'rec-pointer'; p.style.left = '70%'; p.style.top = '70%'; p.style.opacity = '0';
  document.body.appendChild(p);
  const scroller = () => {
    const pane = document.querySelector('#pane');
    return pane && pane.scrollHeight > pane.clientHeight + 4 ? pane : document.scrollingElement;
  };
  // text narrows by content; a number picks the nth visible match
  const find = (sel, text) => {
    const all = [...document.querySelectorAll(sel)].filter(n => n.getClientRects().length);
    if (typeof text === 'number') return all[text];
    return text ? all.find(n => n.textContent.toLowerCase().includes(text.toLowerCase())) : all[0];
  };
  window.__rec = {
    scroller,
    find,
    ready: sel => !!find(sel),
    reveal(sel, text) {
      const n = find(sel, text); if (!n) return false;
      const r = n.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 60) scroller().scrollTop += r.top - innerHeight * 0.35;
      return true;
    },
    pointTo(sel, text) {
      const n = find(sel, text); if (!n) return false;
      const r = n.getBoundingClientRect();
      p.style.opacity = '1'; p.style.left = (r.left + Math.min(r.width / 2, 60)) + 'px'; p.style.top = (r.top + r.height / 2) + 'px';
      return true;
    },
    press(on) { p.classList.toggle('down', on); },
    click(sel, text) { const n = find(sel, text); if (!n) return false; n.click(); return true; },
    focus(sel) { const n = find(sel); n?.focus(); return !!n; },
    type(sel, value) {
      const n = find(sel); if (!n) return false;
      n.value = value; n.dispatchEvent(new Event('input', { bubbles: true })); return true;
    },
    hidePointer() { p.style.opacity = '0'; }
  };
})();`;

async function record(key, scene, theme) {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
  // Leave the page first, so a hash-only address still loads afresh
  let loaded = waitLoad();
  await send('Page.navigate', { url: 'about:blank' });
  await loaded;
  loaded = waitLoad();
  await send('Page.navigate', { url: BASE + scene.url });
  await loaded;
  await sleep(scene.settle ?? 900);
  await evaluate(helpers);
  if (scene.setup) await evaluate(scene.setup);
  await sleep(300);

  // Clip: the pane in the shell (16:10 from its top), the whole viewport elsewhere
  const clip = await evaluate(`(() => {
    const pane = document.querySelector('#pane');
    const r = pane ? pane.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth };
    const w = r.width, h = Math.min(innerHeight - r.top, w * 0.625);
    return { x: r.left, y: r.top, width: w, height: h };
  })()`);
  const scale = SNAP_W / clip.width;
  const frames = [];
  const shot = async hold => {
    // Clip coordinates are in document space: follow the page when the document itself scrolls
    const [sx, sy] = await evaluate('[scrollX, scrollY]');
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { ...clip, x: clip.x + sx, y: clip.y + sy, scale } });
    frames.push({ data, hold });
  };
  for (const step of scene.steps) {
    if (step.scroll != null) {
      // Eased scroll in a few frames
      const from = await evaluate('__rec.scroller().scrollTop');
      const to = typeof step.scroll === 'string' ? await evaluate(step.scroll) : step.scroll;
      const n = step.frames ?? 4;
      for (let i = 1; i <= n; i++) {
        const t = i / n, e = 1 - Math.pow(1 - t, 3);
        await evaluate(`__rec.scroller().scrollTop = ${from + (to - from) * e}`);
        await sleep(60);
        await shot(i === n ? (step.hold ?? 900) : 110);
      }
    } else if (step.click) {
      const [sel, text] = [].concat(step.click);
      const q = JSON.stringify(sel), tq = JSON.stringify(text ?? null);
      await evaluate(`__rec.reveal(${q}, ${tq})`);
      if (!(await evaluate(`__rec.pointTo(${q}, ${tq})`))) { console.warn(`  ${key}: missing ${sel} ${text ?? ''}`); continue; }
      await sleep(160); await shot(step.aim ?? 380);
      await evaluate('__rec.press(true)'); await shot(120);
      await evaluate(`__rec.click(${q}, ${tq})`); await evaluate('__rec.press(false)');
      await sleep(step.after ?? 450); await shot(step.hold ?? 900);
    } else if (step.type) {
      const [sel, text] = step.type;
      const q = JSON.stringify(sel);
      await evaluate(`__rec.reveal(${q})`);
      await evaluate(`__rec.pointTo(${q})`); await evaluate(`__rec.focus(${q})`);
      await shot(300);
      for (let i = 2; i <= text.length; i += 2) {
        await evaluate(`__rec.type(${q}, ${JSON.stringify(text.slice(0, i))})`); await sleep(80); await shot(140);
      }
      await evaluate(`__rec.type(${q}, ${JSON.stringify(text)})`);
      await sleep(step.after ?? 600); await evaluate('__rec.hidePointer()'); await shot(step.hold ?? 1400);
    } else if (step.js) {
      await evaluate(step.js); await sleep(step.after ?? 400); if (step.hold) await shot(step.hold);
    } else if (step.shot) {
      await evaluate('__rec.hidePointer()'); await shot(step.shot);
    }
  }

  // Strip the frames into one tall JPEG, drawn in the page itself
  const strip = await evaluate(`(async () => {
    const srcs = ${JSON.stringify(frames.map(f => f.data))};
    const imgs = await Promise.all(srcs.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/jpeg;base64,' + s; })));
    const c = document.createElement('canvas'); c.width = imgs[0].width; c.height = imgs[0].height * imgs.length;
    const g = c.getContext('2d'); imgs.forEach((img, i) => g.drawImage(img, 0, i * img.height));
    return { url: c.toDataURL('image/jpeg', 0.62), w: imgs[0].width, h: imgs[0].height };
  })()`);
  writeFileSync(`${OUT}/${key}-${theme}.jpg`, Buffer.from(strip.url.split(',')[1], 'base64'));
  return { frames: frames.map(f => f.hold), w: strip.w, h: strip.h };
}

await connect();
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const manifest = {};
for (const [key, scene] of Object.entries(scenes)) {
  if (only.length && !only.includes(key)) continue;
  process.stdout.write(key + ' ');
  try {
    const light = await record(key, scene, 'light');
    await record(key, scene, 'dark');
    manifest[key] = { frames: light.frames };
    console.log(light.frames.length + ' frames');
  } catch (e) { console.log('FAILED ' + e.message); }
}
writeFileSync(`${OUT}/manifest-part.json`, JSON.stringify(manifest, null, 1));
chrome.kill();
process.exit(0);
