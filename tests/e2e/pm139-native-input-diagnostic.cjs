// Test-only observation. Never changes activation, focus, scrolling or cancellation.
function installNativeInputObserver(options = {}) {
  const key = '__pm139NativeInputDiagnostic';
  if (window[key]) return;
  const limits = {events: 96, frames: 24, windows: 12, critical: 2, criticalEvents: 40, before: 4, after: 4};
  const state = {events: [], frames: [], windows: [], critical: [],
    dropped: {events: 0, frames: 0, windows: 0, critical: 0, criticalEvents: 0}};
  const attached = new WeakSet(), ids = new WeakMap();
  let serial = 0, stopped = false, animation, currentCritical = null;
  const round = number => Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
  const stamp = () => ({t: round(performance.now()), wall: round(performance.timeOrigin + performance.now())});
  function describe(node) {
    if (!node) return null;
    if (node === document) return {tag: '#document'};
    if (node.nodeType !== 1) return {tag: '#other'};
    const property = node.closest('[data-property-id]');
    return {
      tag: node.tagName.toLowerCase(), id: (node.id || '').slice(0, 80),
      classes: Array.from(node.classList).slice(0, 4), type: node.getAttribute('type'),
      name: node.getAttribute('name'), property: property && property.getAttribute('data-property-id'),
      connected: node.isConnected, disabled: Boolean(node.disabled)
    };
  }
  function rect(node) {
    if (!node) return null;
    const value = node.getBoundingClientRect();
    return {x: round(value.x), y: round(value.y), width: round(value.width), height: round(value.height)};
  }
  function hit(x, y) {
    return Number.isFinite(x) && Number.isFinite(y) && document.elementFromPoint
      ? describe(document.elementFromPoint(x, y)) : null;
  }
  function targets() {
    const root = document.querySelector('[data-property-id="11111111-1111-4111-8111-111111111111"]');
    if (!root) return [];
    const nodes = [
      ['connect', root.querySelector('.host-calendar-form button[type=submit]')],
      ['save-a', root.querySelector('.host-property-settings button[type=submit]')],
      ['disable', Array.from(root.querySelectorAll('.host-calendar-actions button'))
        .find(button => button.textContent.trim() === 'Disable')]
    ];
    return nodes.filter(([label]) => !options.criticalLabel || label === options.criticalLabel).map(([label, node]) => {
      const bounds = rect(node);
      return {label, node: describe(node), rect: bounds,
        centerHit: bounds && hit(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)};
    });
  }
  function frame() {
    return {...stamp(), scroll: [round(window.scrollX), round(window.scrollY)],
      focus: describe(document.activeElement), targets: targets(),
      rootScroll: getComputedStyle(document.documentElement).scrollBehavior};
  }
  function push(array, value, name, maximum) {
    array.push(value);
    if (array.length > maximum) {array.shift(); state.dropped[name]++;}
  }
  function record(event, phase, listener) {
    if (stopped) return;
    let id = ids.get(event);
    if (!id) {
      id = ++serial; ids.set(event, id);
      queueMicrotask(() => {if (!stopped) record(event, 'capture-microtask', null);});
    }
    const x = Number.isFinite(event.clientX) ? event.clientX : null;
    const y = Number.isFinite(event.clientY) ? event.clientY : null;
    if (event.type === 'pointerdown' && phase === 'document-capture') {
      currentCritical = null;
      const form = event.target.closest && event.target.closest('form');
      const button = event.target.closest && event.target.closest('button[type=submit]');
      const label = form && (form.matches('.host-calendar-form') ? 'connect'
        : form.matches('.host-settings-form') ? 'save-a' : null);
      const window = {id, ...stamp(), before: state.frames.slice(-limits.before), after: []};
      push(state.windows, window, 'windows', limits.windows);
      if (button && label && (!options.criticalLabel || options.criticalLabel === label)) {
        currentCritical = {...window, before: window.before.slice(), after: [], label, events: []};
        push(state.critical, currentCritical, 'critical', limits.critical);
      }
    }
    const sample = {
      ...stamp(), id, phase, type: event.type, isTrusted: event.isTrusted,
      eventPhase: event.eventPhase, defaultPrevented: event.defaultPrevented,
      cancelBubble: event.cancelBubble, pointerType: event.pointerType || null,
      button: Number.isFinite(event.button) ? event.button : null,
      point: [round(x), round(y)], target: describe(event.target), currentTarget: describe(listener),
      hit: hit(x, y), targetRect: rect(event.target.nodeType === 1 ? event.target : null),
      scroll: [round(window.scrollX), round(window.scrollY)], focus: describe(document.activeElement)
    };
    push(state.events, sample, 'events', limits.events);
    if (currentCritical) push(currentCritical.events, sample, 'criticalEvents', limits.criticalEvents);
  }
  const types = ['pointerdown', 'pointerup', 'click', 'submit'];
  function attach(node) {
    if (attached.has(node)) return;
    attached.add(node);
    for (const type of types) {
      node.addEventListener(type, event => record(event, 'control-capture', node), {capture: true, passive: true});
      node.addEventListener(type, event => record(event, 'control-bubble', node), {passive: true});
    }
  }
  function scan() {document.querySelectorAll('button,form').forEach(attach);}
  for (const type of types) {
    document.addEventListener(type, event => record(event, 'document-capture', document), {capture: true, passive: true});
    document.addEventListener(type, event => record(event, 'document-bubble', document), {passive: true});
  }
  const mutations = new MutationObserver(scan);
  mutations.observe(document, {childList: true, subtree: true});
  scan();
  function tick() {
    if (stopped) return;
    const value = frame();
    push(state.frames, value, 'frames', limits.frames);
    for (const window of [...state.windows, ...state.critical])
      if (window.after.length < limits.after) window.after.push(value);
    animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
  Object.defineProperty(window, key, {configurable: true, value: {
    dump() {
      stopped = true;
      cancelAnimationFrame(animation);
      mutations.disconnect();
      return {
        version: 2, ...state, limits, stopped, condition: window.__pm139CausalCondition || null,
        media: {noPreference: matchMedia('(prefers-reduced-motion: no-preference)').matches,
          reduce: matchMedia('(prefers-reduced-motion: reduce)').matches},
        final: frame()
      };
    }
  }});
}

function boundedEvidence(payload, maximum = 64 * 1024) {
  const result = JSON.parse(JSON.stringify(payload));
  result.byteCap = maximum;
  result.trimmed = false;
  result.capDropped = {frames: 0, windows: 0, events: 0, requests: 0, critical: 0};
  const size = () => Buffer.byteLength(JSON.stringify(result));
  // Retain critical down/up/click/submit groups separately from the lossy rolling history.
  // They and their pre/post frames are the LAST data eligible for eviction.
  for (const name of ['frames', 'windows', 'events', 'requests']) {
    const entries = result.observation && result.observation[name] || result[name];
    while (size() > maximum && Array.isArray(entries) && entries.length) {
      entries.shift(); result.trimmed = true; result.capDropped[name]++;
    }
  }
  const critical = result.observation && result.observation.critical;
  while (size() > maximum && critical && critical.length > 1) {
    critical.shift(); result.trimmed = true; result.capDropped.critical++;
  }
  if (size() > maximum) {
    return {version: 2, byteCap: maximum, trimmed: true, capDropped: result.capDropped,
      criticalEvidenceComplete: false, collectionError: 'protected critical evidence exceeded cap; inconclusive'};
  }
  result.criticalEvidenceComplete = Boolean(critical && critical.length &&
    !(result.observation.dropped && result.observation.dropped.criticalEvents) && critical.every(window =>
    window.before.length === 4 && window.after.length === 4 &&
    ['pointerdown', 'pointerup', 'click'].every(type => window.events.some(event =>
      event.type === type && event.phase === 'document-bubble'))));
  if (size() > maximum) return {version: 2, byteCap: maximum, criticalEvidenceComplete: false,
    collectionError: 'completeness metadata exceeded cap; inconclusive'};
  return result;
}

function causalCaseApplies(project, condition) {
  return project === 'mobile-emulation' || project === 'chromium-desktop' && condition === 'auto';
}

// Sole intervention: the test document root, never production bytes or motion preference.
function installRootCondition({rootScroll}) {
  if (rootScroll !== 'auto') return;
  function apply() {
    if (!document.documentElement) return false;
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
    return true;
  }
  if (!apply()) {
    const observer = new MutationObserver(() => {if (apply()) observer.disconnect();});
    observer.observe(document, {childList: true});
  }
}

async function assertCausalCondition(page, expect, rootScroll) {
  const condition = await page.evaluate(requested => {
    const data = {requested, computed: getComputedStyle(document.documentElement).scrollBehavior,
      noPreference: matchMedia('(prefers-reduced-motion: no-preference)').matches,
      reduce: matchMedia('(prefers-reduced-motion: reduce)').matches};
    window.__pm139CausalCondition = data;
    return data;
  }, rootScroll);
  expect(condition).toEqual({requested: rootScroll, computed: rootScroll, noPreference: true, reduce: false});
}

async function persistEvidence(testInfo, evidence) {
  const path = testInfo.outputPath('pm139-native-input.json');
  await require('node:fs/promises').writeFile(path, JSON.stringify(evidence));
  // The unchanged workflow uploads test-results itself. Do not duplicate this file
  // through attach(path), which copies it into a second attachment path.
  return path;
}

function withNativeInputEvidence(base) {
  return base.extend({
    motionEvidence: [async ({page}, use, testInfo) => {
      const rootScroll = testInfo.title.includes('[auto]') ? 'auto' : 'smooth';
      if (!causalCaseApplies(testInfo.project.name, rootScroll)) {await use(); return;}
      const criticalLabel = testInfo.title.includes('calendar connect') ? 'connect' : 'save-a';
      const requests = [], counts = new Map();let droppedRequests = 0;
      const safePath = request => {
        const url = new URL(request.url());
        return url.origin === 'http://127.0.0.1:4173' && url.pathname.startsWith('/api/')
          ? url.pathname : null;
      };
      function note(kind, request, status) {
        const path = safePath(request);
        if (!path) return;
        const method = request.method(), countKey = method + ' ' + path;
        if (kind === 'request' && (counts.has(countKey) || counts.size < 32))
          counts.set(countKey, (counts.get(countKey) || 0) + 1);
        requests.push({wall: Date.now(), kind, method, path, status});
        if (requests.length > 64) {requests.shift(); droppedRequests++;}
      }
      const onRequest = request => note('request', request);
      const onResponse = response => note('response', response.request(), response.status());
      const onFailed = request => note('failed', request);
      page.on('request', onRequest); page.on('response', onResponse); page.on('requestfailed', onFailed);
      await page.addInitScript(installNativeInputObserver, {criticalLabel});
      await page.addInitScript(installRootCondition, {rootScroll});
      try {await use();}
      finally {
        let observation;
        try {
          observation = await page.evaluate(() => window.__pm139NativeInputDiagnostic
            ? window.__pm139NativeInputDiagnostic.dump() : {collectionError: 'observer was not installed'});
        } catch (_) {observation = {collectionError: 'page unavailable at teardown'};}
        page.off('request', onRequest); page.off('response', onResponse); page.off('requestfailed', onFailed);
        const evidence = boundedEvidence({
          version: 2, project: testInfo.project.name, title: testInfo.title, rootScroll,
          originalSource: 'cef83023a205631140460d7ce6b8cc404ee43591',
          requestedMedia: 'no-preference', status: testInfo.status, observation,
          requests, droppedRequests, requestCounts: Array.from(counts, ([key, count]) => ({key, count}))
        });
        await persistEvidence(testInfo, evidence);
      }
    }, {auto: true}]
  });
}

module.exports = {installNativeInputObserver, boundedEvidence, withNativeInputEvidence,
  causalCaseApplies, installRootCondition, assertCausalCondition, persistEvidence};
