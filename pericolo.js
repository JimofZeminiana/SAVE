/*
  The "Ti senti in pericolo?" section: iPhone or Android steps, and the words
  under the phone's hairline figure. Load it before the figures, so it hears
  their first read-out.
*/
(() => {
  // iPhone or Android: starts on the visitor's own system, arrows move between the two tabs
  const platformSwitch = document.querySelector('#platformSwitch');
  const platformTabs = [...platformSwitch.querySelectorAll('[role="tab"]')];

  function setPlatform(name, focus) {
    platformSwitch.dataset.platform = name;
    platformTabs.forEach(tab => {
      const on = tab.dataset.platform === name;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) tab.focus();
    });
  }

  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => setPlatform(tab.dataset.platform));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      setPlatform(tab.dataset.platform === 'ios' ? 'android' : 'ios', true);
    });
  });

  setPlatform(/android/i.test(navigator.userAgent) ? 'android' : 'ios');

  // What the phone figure is doing, in words
  const sosRead = document.querySelector('#sosRead');
  document.querySelector('[data-hairline-host="sos"]').addEventListener('hairline-read', event => {
    const text = event.detail;
    sosRead.textContent = text.startsWith('pressione') ? `Pressione ${text.split(' ')[1]} di 5 sul tasto laterale`
      : text.startsWith('chiamata') ? 'Chiamata d’emergenza in corso' : 'Il tasto laterale';
  });

  // The Signal for Help video plays by itself, unless the reader asked for less motion:
  // then it waits on its first frame, with controls to start it
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const holdVideos = () => document.querySelectorAll('.video-plate video').forEach(video => {
    video.controls = reduceMotion.matches;
    if (reduceMotion.matches) video.pause(); else video.play().catch(() => {});
  });
  reduceMotion.addEventListener('change', holdVideos);
  holdVideos();
})();
