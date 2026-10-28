/*
  Shared behaviour for the questionnaires: progress with time left, one step at a time,
  calm confirmation after an answer. Load before the page's own script.
*/
const TestKit = (() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Long enough to see the answer register, short enough not to feel like waiting
  const ADVANCE_DELAY = 650;
  let advanceTimer = null;

  // Sticky progress sits under the header, whatever height the header wraps to
  const header = document.querySelector('.site-header');
  if (header) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    }).observe(header);
  }

  function timeLeft(seconds) {
    if (seconds <= 0) return 'Alla fine';
    if (seconds < 60) return 'Meno di un minuto alla fine';
    const minutes = Math.round(seconds / 60);
    return minutes === 1 ? 'Circa 1 minuto alla fine' : `Circa ${minutes} minuti alla fine`;
  }

  // segments: [{ label, total, done, current }]; updated in place so the bars glide
  function progress(el, { segments, where, seconds }) {
    if (el.children.length === 0 || el.querySelectorAll('.progress-seg').length !== segments.length) {
      el.innerHTML = `<div class="progress-track">${segments.map(() => '<div class="progress-seg"><div class="progress-bar"><i></i></div><span></span></div>').join('')}</div>
        <div class="progress-meta"><span class="where"></span><span class="left"></span></div>`;
    }
    el.querySelectorAll('.progress-seg').forEach((node, i) => {
      const s = segments[i];
      node.style.setProperty('--size', Math.max(s.total, 1));
      node.querySelector('i').style.setProperty('--done', `${s.total ? Math.min(100, s.done / s.total * 100) : 0}%`);
      node.querySelector('span').textContent = s.label;
      node.classList.toggle('is-current', Boolean(s.current));
    });
    el.querySelector('.where').innerHTML = where;
    el.querySelector('.left').textContent = seconds == null ? '' : timeLeft(seconds);
  }

  // Replace the current step: the old one steps aside, the new one settles in
  function swap(stage, html, { focus = true } = {}) {
    cancelAdvance();
    const old = stage.querySelector('.step');
    const show = () => {
      stage.innerHTML = `<div class="step">${html}</div>`;
      const top = stage.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 120;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      if (focus) {
        const heading = stage.querySelector('h1, h2, .question');
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      }
    };
    if (!old) { show(); return; }
    old.classList.add('is-leaving');
    setTimeout(show, reduceMotion.matches ? 120 : 190);
  }

  // After a first answer: show it was registered, then move on by itself.
  // Changing the answer while that move is still pending keeps it pending.
  function confirmThen(next, { auto = true } = {}) {
    const keepGoing = auto || advanceTimer !== null;
    clearTimeout(advanceTimer);
    advanceTimer = null;
    const saved = document.querySelector('.step .saved');
    if (saved) {
      saved.textContent = keepGoing ? 'Risposta registrata' : 'Risposta aggiornata';
      saved.classList.add('is-visible');
    }
    if (keepGoing) advanceTimer = setTimeout(() => { advanceTimer = null; next(); }, ADVANCE_DELAY);
  }

  function cancelAdvance() { clearTimeout(advanceTimer); advanceTimer = null; }

  // Number keys pick an answer, Enter moves on
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.target.closest('input[type="text"], input[type="date"], textarea, select, dialog')) return;
    const step = document.querySelector('.step:not(.is-leaving)');
    if (!step) return;
    if (/^[1-9]$/.test(event.key)) {
      const inputs = step.querySelectorAll('.options[data-keys] .option input');
      const input = inputs[Number(event.key) - 1];
      if (input) { event.preventDefault(); input.click(); }
    }
    if (event.key === 'Enter' && !event.target.closest('button, a, summary')) {
      const next = step.querySelector('[data-next]:not(:disabled)');
      if (next) { event.preventDefault(); next.click(); }
    }
  });

  return { progress, swap, confirmThen, cancelAdvance, timeLeft };
})();
