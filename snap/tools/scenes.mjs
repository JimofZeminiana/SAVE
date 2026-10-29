// One scene per page a card can open: where it starts and what the pointer does there
const next = { click: ['.btn.primary'] };
const pick = n => ({ click: ['.option', n - 1] });
const toTop = sel => `(() => { const s = __rec.scroller(); const n = __rec.find(${JSON.stringify(sel)}); return n ? s.scrollTop + n.getBoundingClientRect().top - 40 : s.scrollTop; })()`;

export const scenes = {
  pericolo: { url: 'index.html#pericolo', steps: [
    { shot: 900 },
    { scroll: toTop('#pericolo .figure-title'), hold: 800 },
    { click: ['[role="tab"]', 'Android'], hold: 1200 },
    { click: ['[role="tab"]', 'iPhone'], hold: 900 },
    { scroll: '__rec.scroller().scrollHeight', frames: 5, hold: 1600 }
  ] },
  centri: { url: 'trova-centro.html', settle: 2200, steps: [
    { shot: 800 },
    { scroll: toTop('#searchInput'), after: 1500, hold: 900 },
    { type: ['#searchInput', 'Venezia'], after: 2200, hold: 2000 },
    { scroll: '__rec.scroller().scrollTop + 260', frames: 3, after: 800, hold: 1800 }
  ] },
  forme: { url: 'index.html#forme', steps: [
    { shot: 1000 }, { scroll: toTop('#forme .tile'), hold: 1400 }, { scroll: '__rec.scroller().scrollHeight', frames: 5, hold: 1600 }
  ] },
  comunita: { url: 'index.html#comunita', steps: [
    { shot: 900 }, { scroll: toTop('#comunita .panel'), hold: 1600 }, { scroll: toTop('#comunita .list-head'), hold: 1400 }
  ] },
  orientamento: { url: 'orientamento.html', steps: [
    { shot: 800 }, next, pick(1), pick(3), next, pick(2), next
  ] },
  isa: { url: 'isa.html', steps: [
    { shot: 800 }, next, pick(1), next, pick(2), next, pick(1)
  ] },
  sea: { url: 'economic-abuse.html', steps: [
    { shot: 800 }, next, pick(2), next, pick(3), next, pick(1)
  ] },
  sara: { url: 'sara.html', steps: [
    { shot: 800 }, next, pick(1), pick(2), next, pick(1), pick(3)
  ] },
  rischio: { url: 'index.html#rischio', steps: [
    { shot: 700 },
    { click: ['#riskFilter button', 'Adattamento'], hold: 1000 },
    { click: ['#riskList summary'], hold: 1400 },
    { click: ['#riskFilter button', 'Vulnerabilità'], hold: 1100 },
    { click: ['#riskFilter button', 'Tutte'], hold: 900 }
  ] },
  catalogo: { url: 'index.html#catalogo', steps: [
    { shot: 900 }, { scroll: toTop('table.catalogue'), hold: 1200 }, { scroll: '__rec.scroller().scrollHeight', frames: 6, hold: 1600 }
  ] },
  quadro: { url: 'index.html#quadro', steps: [
    { shot: 900 }, { scroll: toTop('#mappa .map'), hold: 2200 }
  ] },
  strumenti: { url: 'index.html#strumenti', steps: [
    { shot: 900 }, { scroll: toTop('#strumenti .forms'), hold: 1600 }, { scroll: '__rec.scroller().scrollHeight', frames: 5, hold: 1600 }
  ] },
  fonti: { url: 'index.html#fonti', steps: [
    { shot: 900 }, { scroll: toTop('#fonti .source-grid'), hold: 1600 }, { scroll: '__rec.scroller().scrollHeight', frames: 5, hold: 1600 }
  ] },
  handbook: { url: 'archivio.html?tipo=linee-guida,guide,formazione&titolo=Handbook', settle: 1400, steps: [
    { shot: 900 }, { scroll: toTop('.filters'), hold: 1200 }, { scroll: '__rec.scroller().scrollTop + 900', frames: 6, hold: 1400 }
  ] },
  archivio: { url: 'archivio.html', settle: 1400, steps: [
    { shot: 800 }, { scroll: toTop('.filters'), hold: 600 },
    { type: ['#searchInput', 'violenza'], hold: 1400 },
    { js: '__rec.type("#searchInput", "")', after: 600, hold: 900 }
  ] },
  attivita: { url: 'attivita.html', settle: 1400, steps: [
    { shot: 800 }, { scroll: toTop('.filters'), hold: 600 },
    { type: ['#searchInput', 'consenso'], hold: 1600 },
    { js: '__rec.type("#searchInput", "")', after: 600, hold: 900 }
  ] },
  accanto: { url: 'stare-accanto.html', steps: [
    { shot: 800 }, { click: ['.person'] }, next, pick(1), next
  ] },
  casi: { url: 'cosa-fare.html', steps: [
    { shot: 800 }, { scroll: toTop('.case'), hold: 900 }, { click: ['.case-head'], hold: 1600 }, { scroll: '__rec.scroller().scrollTop + 500', frames: 4, hold: 1400 }
  ] },
  gioco: { url: 'The Small Act.html', settle: 1400, steps: [
    { shot: 1000 }, { click: ['.choice'], hold: 700 }, { click: ['#commit'], hold: 1600 }, { click: ['#next'], hold: 1200 }
  ] },
  app: { url: 'index.html#app', steps: [
    { shot: 900 }, { scroll: toTop('.app-grid'), hold: 1600 }, { scroll: '__rec.scroller().scrollHeight', frames: 5, hold: 1600 }
  ] }
};
