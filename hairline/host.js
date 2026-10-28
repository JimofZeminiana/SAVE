/*
  Hairline figures inside the site's pages, without the bench's controls.
  Load kernel.js, then this file, then the figures:

    <div data-hairline-host="sos"></div>
    <script src="hairline/kernel.js"></script>
    <script src="hairline/host.js"></script>
    <script src="hairline/sos.js"></script>

  Each figure mounts into every element that names it. What the figure reads out
  ("pressione 3", a step number) arrives as a "hairline-read" event on that element,
  so the page can write it where it wants.
*/
(() => {
  window.hairline = (figure) => {
    const stages = document.querySelectorAll(`[data-hairline-host="${figure.name}"]`);
    if (!stages.length) return;
    HL.inject(document);
    const [, mid] = figure.range;

    stages.forEach((stage) => {
      stage.setAttribute('data-hairline', figure.name);
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', stage.dataset.label || figure.means);
      const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
      let text = '';
      const read = {
        get textContent() { return text; },
        set textContent(value) {
          const next = value == null ? '' : String(value);
          if (next === text) return;
          text = next;
          stage.dispatchEvent(new CustomEvent('hairline-read', { detail: text }));
        },
      };
      figure.mount({ stage, svg, read }, Number(stage.dataset.value) || mid);
    });
  };
})();
