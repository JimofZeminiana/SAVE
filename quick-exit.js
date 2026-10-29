/*
  Quick exit and safety notice, shared by every page.
  Load it at the end of <body>: <script src="quick-exit.js"></script>

  - The "Esci subito dal sito" link (.exit-btn) and the Esc key leave the site at once.
  - The first page opened in a tab shows a safety notice, as Tech Safety Canada does,
    and so does every reload. Moving on to another page of the site does not repeat it.

  The destination must be a page no installed app claims: links like news.google.com
  open their app on phones and leave this tab untouched behind it.

  Only sessionStorage is used: it disappears when the tab closes, so nothing about the
  visit is kept on the device the way localStorage would keep it.
*/
(() => {
  const EXIT_URL = 'https://www.google.com/search?q=meteo';
  const exitLink = document.querySelector('.exit-btn');
  // Inside the single page this page is a frame: leaving must take the whole tab, and the
  // notice belongs to the outer page
  const framed = window.self !== window.top;

  function store(action, key, value) {
    try {
      if (action === 'get') return sessionStorage.getItem(key);
      if (action === 'set') sessionStorage.setItem(key, value);
      if (action === 'remove') sessionStorage.removeItem(key);
    } catch {}
    return null;
  }

  function quickExit() {
    // Nothing of this page stays visible, even if the tab is left behind
    document.documentElement.style.visibility = 'hidden';
    document.title = 'Meteo di oggi';
    store('set', 'quickExit', '1');
    const url = exitLink ? exitLink.href : EXIT_URL;
    // replace() drops this page from history, so Back does not return here
    if (framed) {
      try { window.top.location.replace(url); return; } catch {}
      // A page opened from disk cannot reach the outer page's location, but may still navigate it
      try { window.open(url, '_top'); return; } catch {}
    }
    location.replace(url);
  }

  if (exitLink) {
    exitLink.href = EXIT_URL;
    exitLink.setAttribute('aria-keyshortcuts', 'Escape');
    exitLink.title = 'Scorciatoia: tasto Esc';
    exitLink.addEventListener('click', event => {
      event.preventDefault();
      quickExit();
    });
  }

  // Esc leaves from anywhere on the page, including inside fields and the notice
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    quickExit();
  }, true);

  // If the tab comes back (reload, or restored from the back-forward cache), leave again once
  function leaveIfExited() {
    if (store('get', 'quickExit') !== '1') return false;
    store('remove', 'quickExit');
    quickExit();
    return true;
  }
  window.addEventListener('pageshow', event => { if (event.persisted) leaveIfExited(); });
  if (leaveIfExited()) return;

  // Safety notice ----------------------------------------------------------

  // Once seen it does not follow the reader from page to page, but a reload shows it again:
  // whoever reloads may be someone else at the same device
  const reloaded = performance.getEntriesByType?.('navigation')[0]?.type === 'reload';
  if (framed || (store('get', 'safetyNoticeSeen') === '1' && !reloaded) || typeof HTMLDialogElement !== 'function') return;

  const style = document.createElement('style');
  style.textContent = `
    .sn-dialog {
      --sn-paper: #ffffff;
      --sn-ink: #151515;
      --sn-muted: #6b6b6b;
      --sn-fill: rgba(21,21,21,.05);
      --sn-exit: #c8102e;
      --sn-ease: cubic-bezier(.32,.72,0,1);
      width: min(600px, calc(100vw - 32px));
      max-height: calc(100dvh - 32px);
      margin: auto;
      padding: 0;
      overflow: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--sn-ink);
      border-radius: 12px;
      background: var(--sn-paper);
      color: var(--sn-ink);
      font-family: inherit;
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: 0;
    }
    @media (prefers-color-scheme: dark) {
      .sn-dialog {
        --sn-paper: #151515;
        --sn-ink: #f1f1ef;
        --sn-muted: #a3a3a0;
        --sn-fill: rgba(241,241,239,.07);
        --sn-exit: #d4202f;
      }
    }
    .sn-dialog::backdrop { background: rgba(21,21,21,.5); }
    html:has(.sn-dialog[open]) { overflow: hidden; }

    /* One entrance, settling without overshoot */
    .sn-dialog[open] { animation: sn-in .42s var(--sn-ease); }
    .sn-dialog[open]::backdrop { animation: sn-fade .3s ease-out; }
    @keyframes sn-in { from { opacity: 0; transform: translateY(10px) scale(.985); } }
    @keyframes sn-fade { from { opacity: 0; } }

    .sn-dialog h2 {
      margin: 0;
      padding: 16px 20px 14px;
      border-bottom: 1px solid var(--sn-ink);
      font-size: 1.25rem;
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: -.01em;
    }
    .sn-lead {
      margin: 0;
      padding: 16px 20px 18px;
      font-size: 1.125rem;
      line-height: 1.4;
      letter-spacing: -.005em;
    }
    .sn-rows { margin: 0; padding: 0; list-style: none; }
    .sn-rows li {
      display: grid;
      grid-template-columns: 11rem 1fr;
      gap: 4px 20px;
      padding: 12px 20px 13px;
      border-top: 1px solid var(--sn-ink);
      font-size: .9375rem;
    }
    .sn-rows b { font-weight: 500; }
    .sn-rows span { color: var(--sn-muted); }
    .sn-rows a { color: var(--sn-ink); text-underline-offset: 3px; }
    .sn-dialog kbd {
      padding: 0 .35em;
      border: 1px solid currentColor;
      border-radius: 4px;
      font: inherit;
      font-size: .85em;
    }
    @media (hover: none) and (pointer: coarse) { .sn-key { display: none; } }
    @media (hover: hover), (pointer: fine) { .sn-touch { display: none; } }

    .sn-how { border-top: 1px solid var(--sn-ink); }
    .sn-how summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      font-size: .9375rem;
      cursor: pointer;
      list-style: none;
      touch-action: manipulation;
      transition: background-color .2s var(--sn-ease);
    }
    .sn-how summary::-webkit-details-marker { display: none; }
    .sn-how summary::after {
      content: "";
      width: 7px;
      height: 7px;
      margin-right: 4px;
      border-right: 1px solid currentColor;
      border-bottom: 1px solid currentColor;
      transform: translateY(-3px) rotate(45deg);
      transition: transform .3s var(--sn-ease);
    }
    .sn-how[open] summary::after { transform: translateY(1px) rotate(225deg); }
    .sn-how summary:active { background: var(--sn-fill); transition-duration: 0s; }
    .sn-how dl { margin: 0; padding: 0 20px 14px; font-size: .875rem; }
    .sn-how dt { font-weight: 500; margin-top: 10px; }
    .sn-how dd { margin: 2px 0 0; color: var(--sn-muted); }

    /* Both choices stay in view while the notice scrolls on small screens */
    .sn-actions {
      position: sticky;
      bottom: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px 18px;
      border-top: 1px solid var(--sn-ink);
      background: var(--sn-paper);
    }
    .sn-actions button,
    .sn-actions a {
      min-height: 44px;
      padding: 10px 18px;
      border-radius: 999px;
      font: inherit;
      font-size: .9375rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      touch-action: manipulation;
      transition: transform .2s var(--sn-ease), filter .2s var(--sn-ease), background-color .2s var(--sn-ease);
    }
    .sn-continue { border: 1px solid var(--sn-ink); background: none; color: var(--sn-ink); }
    .sn-exit { display: inline-flex; align-items: center; border: 1px solid var(--sn-exit); background: var(--sn-exit); color: #fff; }
    .sn-actions button:active,
    .sn-actions a:active { transform: scale(.97); filter: brightness(.92); transition-duration: 0s; }
    @media (hover: hover) {
      .sn-continue:hover { background: var(--sn-fill); }
      .sn-how summary:hover { background: var(--sn-fill); }
    }
    .sn-dialog :focus-visible { outline: 2px solid var(--sn-ink); outline-offset: 3px; }

    @media (max-width: 560px) {
      .sn-rows li { grid-template-columns: 1fr; }
      .sn-actions { flex-wrap: nowrap; gap: 8px; padding: 12px 16px 16px; }
      .sn-actions button, .sn-actions a { flex: 1; justify-content: center; text-align: center; padding-inline: 12px; }
      .sn-dialog h2, .sn-lead, .sn-rows li, .sn-how summary { padding-inline: 16px; }
      .sn-how dl { padding-inline: 16px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sn-dialog[open] { animation: sn-fade .2s ease-out; }
      .sn-dialog *, .sn-dialog *::after { transition-property: opacity, background-color, color !important; }
    }
    @media (prefers-contrast: more) {
      .sn-dialog { --sn-muted: var(--sn-ink); border-width: 2px; }
    }
  `;
  document.head.appendChild(style);

  const dialog = document.createElement('dialog');
  dialog.className = 'sn-dialog';
  dialog.setAttribute('aria-labelledby', 'sn-title');
  dialog.innerHTML = `
    <h2 id="sn-title">Prima di continuare: la tua sicurezza</h2>
    <p class="sn-lead">Se pensi che qualcuno controlli il tuo telefono o il tuo computer, apri questo sito da un dispositivo che quella persona non può vedere: di un’amica, del lavoro, di una biblioteca.</p>
    <ul class="sn-rows">
      <li><b>Uscire in un attimo</b><span><span class="sn-key">Premi <kbd>Esc</kbd> oppure usa</span><span class="sn-touch">Tocca</span> il pulsante “Esci subito dal sito”, sempre in alto. Si apre una ricerca sul meteo e il tasto Indietro non riporta qui.</span></li>
      <li><b>La cronologia resta</b><span>La visita rimane nella cronologia del browser. Usa una finestra privata o in incognito, oppure cancella solo le pagine di questo sito: svuotare tutta la cronologia potrebbe insospettire.</span></li>
      <li><b>In pericolo adesso</b><span>Chiama il <a href="tel:112">112</a>. Per un aiuto gratuito e anonimo, il <a href="tel:1522">1522</a> risponde 24 ore su 24.</span></li>
    </ul>
    <details class="sn-how">
      <summary>Come cancellare queste pagine dalla cronologia</summary>
      <dl>
        <dt>Chrome, su Android e computer</dt>
        <dd>Menu ⋮ › Cronologia, poi elimina le voci di questo sito con la ✕ o selezionandole.</dd>
        <dt>Safari su iPhone</dt>
        <dd>Icona del libro › scheda con l’orologio, poi scorri verso sinistra su ogni voce e tocca Elimina.</dd>
        <dt>Safari su Mac</dt>
        <dd>Cronologia › Mostra tutta la cronologia, seleziona le voci e premi il tasto Cancella.</dd>
        <dt>Firefox</dt>
        <dd>Menu › Cronologia › Gestisci cronologia, poi clic destro sulla voce › Elimina pagina.</dd>
      </dl>
    </details>
    <div class="sn-actions">
      <button type="button" class="sn-continue" autofocus>Ho capito</button>
      <a class="sn-exit" href="${EXIT_URL}">Esci subito</a>
    </div>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector('.sn-continue').addEventListener('click', () => {
    store('set', 'safetyNoticeSeen', '1');
    dialog.close();
  });
  dialog.querySelector('.sn-exit').addEventListener('click', event => {
    event.preventDefault();
    quickExit();
  });
  // Esc is handled above as quick exit; never let the dialog close itself instead
  dialog.addEventListener('cancel', event => event.preventDefault());

  dialog.showModal();
})();
