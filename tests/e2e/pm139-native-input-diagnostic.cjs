// Test-only observation. Never changes activation, focus, scrolling or cancellation.
function installNativeInputObserver() {
  const key = '__pm139NativeInputDiagnostic';
  if (window[key]) return;
  const limits = {events: 96, frames: 24, windows: 12, before: 4, after: 4};
  const state = {events: [], frames: [], windows: [], dropped: {events: 0, frames: 0, windows: 0}};
  const attached = new WeakSet(), ids = new WeakMap();
  let serial = 0, stopped = false, animation;
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
    return nodes.map(([label, node]) => {
      const bounds = rect(node);
      return {label, node: describe(node), rect: bounds,
        centerHit: bounds && hit(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)};
    });
  }
  function frame() {
    return {...stamp(), scroll: [round(window.scrollX), round(window.scrollY)],
      focus: describe(document.activeElement), targets: targets()};
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
      queueMicrotask(() => {if (!stopped) record(event, 'after-dispatch', null);});
    }
    const x = Number.isFinite(event.clientX) ? event.clientX : null;
    const y = Number.isFinite(event.clientY) ? event.clientY : null;
    push(state.events, {
      ...stamp(), id, phase, type: event.type, isTrusted: event.isTrusted,
      eventPhase: event.eventPhase, defaultPrevented: event.defaultPrevented,
      cancelBubble: event.cancelBubble, pointerType: event.pointerType || null,
      button: Number.isFinite(event.button) ? event.button : null,
      point: [round(x), round(y)], target: describe(event.target), currentTarget: describe(listener),
      nearestControl: describe(event.target.closest && event.target.closest('button,input,form,a')),
      hit: hit(x, y), targetRect: rect(event.target.nodeType === 1 ? event.target : null),
      scroll: [round(window.scrollX), round(window.scrollY)], focus: describe(document.activeElement)
    }, 'events', limits.events);
    if (event.type === 'pointerdown' && phase === 'document-capture') {
      push(state.windows, {id, ...stamp(), before: state.frames.slice(-limits.before), after: []},
        'windows', limits.windows);
    }
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
    for (const window of state.windows) if (window.after.length < limits.after) window.after.push(value);
    animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
  Object.defineProperty(window, key, {configurable: true, value: {
    dump() {
      stopped = true;
      cancelAnimationFrame(animation);
      mutations.disconnect();
      return {
        version: 1, ...state, limits, stopped,
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
  const size = () => Buffer.byteLength(JSON.stringify(result));
  for (const name of ['frames', 'windows', 'events', 'requests']) {
    const entries = result.observation && result.observation[name] || result[name];
    while (size() > maximum && Array.isArray(entries) && entries.length) {
      entries.shift(); result.trimmed = true;
    }
  }
  if (size() > maximum) {
    return {version: 1, byteCap: maximum, trimmed: true, collectionError: 'metadata exceeded evidence cap'};
  }
  return result;
}

function withNativeInputEvidence(base) {
  return base.extend({
    motionEvidence: [async ({page}, use, testInfo) => {
      if (testInfo.project.name === 'webkit-desktop') {await use(); return;}
      const requests = [], counts = new Map();
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
        if (requests.length > 64) requests.shift();
      }
      const onRequest = request => note('request', request);
      const onResponse = response => note('response', response.request(), response.status());
      const onFailed = request => note('failed', request);
      page.on('request', onRequest); page.on('response', onResponse); page.on('requestfailed', onFailed);
      await page.addInitScript(installNativeInputObserver);
      try {await use();}
      finally {
        let observation;
        try {
          observation = await page.evaluate(() => window.__pm139NativeInputDiagnostic
            ? window.__pm139NativeInputDiagnostic.dump() : {collectionError: 'observer was not installed'});
        } catch (_) {observation = {collectionError: 'page unavailable at teardown'};}
        page.off('request', onRequest); page.off('response', onResponse); page.off('requestfailed', onFailed);
        const evidence = boundedEvidence({
          version: 1, project: testInfo.project.name, title: testInfo.title,
          originalSource: 'cef83023a205631140460d7ce6b8cc404ee43591',
          requestedMedia: 'no-preference', status: testInfo.status, observation,
          requests, requestCounts: Array.from(counts, ([key, count]) => ({key, count}))
        });
        await testInfo.attach('pm139-native-input', {
          body: Buffer.from(JSON.stringify(evidence)), contentType: 'application/json'
        });
      }
    }, {auto: true}]
  });
}

module.exports = {installNativeInputObserver, boundedEvidence, withNativeInputEvidence};
