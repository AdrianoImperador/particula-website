(() => {
  const root = document.getElementById('particula-hero');
  const journey = root.querySelector('.journey');
  const cue = root.querySelector('.scroll-cue');
  const wheel = root.querySelector('.section-wheel');
  const product = document.getElementById('product');
  const wheelList = root.querySelector('.wheel-list');
  const wheelLinks = [...wheelList.querySelectorAll('a')];
  const sections = wheelLinks.map(link => document.getElementById(link.getAttribute('href').slice(1)));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px)');
  const rowHeight = 44;
  let pending = false, selected = -1, wheelPending = false, lastWheelTime = -Infinity;
  const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const moveTo = id => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top, behavior: behavior() });
  };
  const renderWheel = () => {
    wheelLinks.forEach((link, index) => {
      const distance = (index * rowHeight - wheelList.scrollTop) / rowHeight;
      link.style.setProperty('--angle', `${clamp(distance * -23, -65, 65)}deg`);
      link.style.setProperty('--scale', `${Math.max(.8, 1 - Math.abs(distance) * .08)}`);
      link.style.setProperty('--fade', `${Math.max(.15, 1 - Math.abs(distance) * .3)}`);
    });
    wheelPending = false;
  };
  const selectSection = index => {
    if (index === selected) return;
    selected = index;
    wheelLinks.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (desktop.matches) wheelList.scrollTo({ top: index * rowHeight, behavior: behavior() });
  };
  const render = () => {
    const heroRange = Math.max(1, journey.offsetHeight - root.clientHeight);
    const heroProgress = clamp(root.scrollTop / heroRange, 0, 1);
    const pageRange = Math.max(1, root.scrollHeight - root.clientHeight);
    const pageProgress = clamp(root.scrollTop / pageRange, 0, 1);
    const depth = pageProgress * pageProgress * (3 - 2 * pageProgress);
    root.style.setProperty('--p', heroProgress.toFixed(5));
    root.style.setProperty('--page-p', pageProgress.toFixed(5));
    // Orbital depth: approach the illustration and gently change perspective.
    // The whole effect follows scroll position and reverses without inertia.
    root.style.setProperty('--bg-zoom', (1.03 + depth * .18).toFixed(5));
    root.style.setProperty('--bg-turn', `${(-1.2 + depth * 3.2).toFixed(3)}deg`);
    root.style.setProperty('--bg-x', `${(Math.sin(pageProgress * Math.PI) * -2.5).toFixed(3)}%`);
    root.style.setProperty('--bg-y', `${(depth * -3).toFixed(3)}%`);
    cue.style.visibility = heroProgress > .34 ? 'hidden' : 'visible';
    wheel.classList.toggle('is-dark', heroProgress > .38);
    // The opening brand scene has no wheel entry; reveal it at The product.
    // Progress follows scroll position directly, including when scrolling back.
    const productTop = product.getBoundingClientRect().top - root.getBoundingClientRect().top;
    const wheelProgress = desktop.matches ? clamp((root.clientHeight * .65 - productTop) / (root.clientHeight * .35), 0, 1) : 0;
    wheel.style.setProperty('--wheel-p', wheelProgress.toFixed(5));
    wheel.classList.toggle('is-visible', wheelProgress > 0);
    wheel.inert = wheelProgress === 0;
    wheel.setAttribute('aria-hidden', String(wheelProgress === 0));
    const readingLine = root.getBoundingClientRect().top + root.clientHeight * .35;
    let active = productTop < root.clientHeight ? 0 : -1;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= readingLine) active = index;
    });
    if (root.scrollTop >= pageRange - 2) active = sections.length - 1;
    selectSection(active);
    pending = false;
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(render); } };
  root.addEventListener('scroll', schedule, { passive: true });
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(root);
  // Content changes also alter the remaining parallax distance.
  [...root.children].forEach(child => { if (child !== wheel) resizeObserver.observe(child); });
  desktop.addEventListener('change', () => { selected = -1; schedule(); });
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      moveTo(link.getAttribute('href').slice(1));
    });
  });
  wheelList.addEventListener('scroll', () => {
    if (!wheelPending) { wheelPending = true; requestAnimationFrame(renderWheel); }
  }, { passive: true });
  wheelList.addEventListener('wheel', event => {
    if (!desktop.matches || !event.deltaY) return;
    event.preventDefault();
    // One section per deliberate wheel gesture; trackpad inertia cannot skip the page.
    if (event.timeStamp - lastWheelTime < 550) return;
    lastWheelTime = event.timeStamp;
    const next = clamp(selected + Math.sign(event.deltaY), 0, wheelLinks.length - 1);
    moveTo(sections[next].id);
  }, { passive: false });
  wheelList.addEventListener('keydown', event => {
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = wheelLinks.indexOf(document.activeElement);
    const origin = current < 0 ? selected : current;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? wheelLinks.length - 1 : clamp(origin + (event.key === 'ArrowDown' ? 1 : -1), 0, wheelLinks.length - 1);
    wheelLinks[next].focus({ preventScroll: true });
    moveTo(sections[next].id);
  });
  wheelLinks.forEach((link, index) => link.addEventListener('focus', () => {
    wheelList.scrollTo({ top: index * rowHeight, behavior: behavior() });
  }));
  wheel.addEventListener('focusout', event => {
    if (!wheel.contains(event.relatedTarget)) wheelList.scrollTo({ top: selected * rowHeight, behavior: behavior() });
  });
  root.querySelectorAll('.glow-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--my', `${event.clientY - bounds.top}px`);
    });
  });
  const problemSection = root.querySelector('#problem');
  const comparisonButtons = [...problemSection.querySelectorAll('[data-comparison]')];
  const comparisonScenarios = {
    current: {
      cost: '45', time: '3', unit: ' weeks', costRatio: 1, timeRatio: 1,
      result: ''
    },
    nanoglyph: {
      cost: '38', time: '1', unit: ' week', costRatio: 38 / 45, timeRatio: 1 / 3,
      result: '≈$7k lower spend. ≈2 weeks less waiting.'
    }
  };
  const showComparison = name => {
    const scenario = comparisonScenarios[name];
    comparisonButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.comparison === name)));
    problemSection.querySelector('.tradeoff').dataset.scenario = name;
    problemSection.classList.toggle('has-nanoglyph', name === 'nanoglyph');
    const fields = {
      'problem-cost': scenario.cost, 'problem-time': scenario.time, 'problem-time-unit': scenario.unit,
      'comparison-result': scenario.result
    };
    Object.entries(fields).forEach(([id, text]) => { document.getElementById(id).textContent = text; });
    problemSection.querySelectorAll('.comparison-copy [data-copy]').forEach(copy => {
      copy.setAttribute('aria-hidden', String(copy.dataset.copy !== name));
    });
    document.getElementById('cost-meter').style.transform = `scaleX(${scenario.costRatio})`;
    document.getElementById('time-meter').style.transform = `scaleX(${scenario.timeRatio})`;
    problemSection.querySelector('.cost-panel .big-number').setAttribute('aria-label', `Approximately ${scenario.cost},000 US dollars`);
    problemSection.querySelector('.time-panel .big-number').setAttribute('aria-label', `Approximately ${scenario.time}${scenario.unit}`);
    schedule();
  };
  comparisonButtons.forEach(button => button.addEventListener('click', () => showComparison(button.dataset.comparison)));
  showComparison('current');
  const explorer = root.querySelector('.use-explorer');
  const useTabs = [...explorer.querySelectorAll('[role="tab"]')];
  const usePanels = [...explorer.querySelectorAll('[role="tabpanel"]')];
  const usePosition = explorer.querySelector('.use-position');
  const useStage = explorer.querySelector('.use-stage');
  let useIndex = 0, touchStart = null;
  const showUse = (index, focusTab = false) => {
    useIndex = (index + useTabs.length) % useTabs.length;
    useTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === useIndex));
      tab.tabIndex = i === useIndex ? 0 : -1;
      usePanels[i].hidden = i !== useIndex;
    });
    usePosition.textContent = `${String(useIndex + 1).padStart(2, '0')} / ${String(useTabs.length).padStart(2, '0')}`;
    if (focusTab) useTabs[useIndex].focus({ preventScroll: true });
    const tabStrip = useTabs[useIndex].parentElement;
    if (tabStrip.scrollWidth > tabStrip.clientWidth) {
      tabStrip.scrollTo({ left: useTabs[useIndex].offsetLeft - tabStrip.offsetLeft - 8, behavior: behavior() });
    }
    schedule();
  };
  useTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showUse(index));
    tab.addEventListener('keydown', event => {
      const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0;
      if (!direction && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      showUse(event.key === 'Home' ? 0 : event.key === 'End' ? useTabs.length - 1 : useIndex + direction, true);
    });
  });
  explorer.querySelectorAll('[data-use-step]').forEach(button => button.addEventListener('click', () => showUse(useIndex + Number(button.dataset.useStep))));
  useStage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  useStage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showUse(useIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  useStage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  const workflowDialog = root.querySelector('.workflow-dialog');
  const workflowOpen = root.querySelector('.workflow-open');
  const closeWorkflow = () => workflowDialog.close();
  workflowOpen.addEventListener('click', () => {
    workflowDialog.showModal();
    workflowOpen.setAttribute('aria-expanded', 'true');
  });
  workflowDialog.querySelector('.workflow-close').addEventListener('click', closeWorkflow);
  workflowDialog.addEventListener('click', event => {
    if (event.target === workflowDialog) {
      const box = workflowDialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeWorkflow();
    }
  });
  workflowDialog.addEventListener('close', () => {
    workflowOpen.setAttribute('aria-expanded', 'false');
    workflowOpen.focus({ preventScroll: true });
  });
  workflowDialog.querySelector('a[href="#pilot"]').addEventListener('click', closeWorkflow);
  const figureDialog = root.querySelector('.figure-dialog');
  const figureDialogArt = figureDialog.querySelector('.figure-dialog-art');
  const figureDialogTitle = figureDialog.querySelector('#figure-dialog-title');
  explorer.querySelectorAll('[data-use-figure]').forEach(button => {
    button.addEventListener('click', () => {
      const panel = usePanels[Number(button.dataset.useFigure)];
      const svg = panel.querySelector('.use-figure > svg');
      // Prefix cloned IDs so modal definitions stay independent of hidden tabs.
      let markup = svg.outerHTML;
      [...svg.querySelectorAll('[id]')].forEach(node => {
        const id = node.id;
        markup = markup.replaceAll(`id="${id}"`, `id="large-${id}"`).replaceAll(`#${id})`, `#large-${id})`);
      });
      markup = markup.replace(/aria-labelledby="([^"]+)"/, (_, ids) => `aria-labelledby="${ids.split(' ').map(id => `large-${id}`).join(' ')}"`);
      figureDialogArt.innerHTML = markup;
      figureDialogTitle.textContent = panel.querySelector('h3').textContent;
      figureDialog.showModal();
    });
  });
  figureDialog.querySelector('.figure-close').addEventListener('click', () => figureDialog.close());
  figureDialog.addEventListener('click', event => { if (event.target === figureDialog) figureDialog.close(); });
  document.getElementById('copyright-year').textContent = new Date().getFullYear();
  renderWheel(); render();
})();
