const {createCore} = require('../../public/assets/shared/core.js');
function installCore(w) {
  w.AbortController = globalThis.AbortController;
  // Normalize the pre-existing lightweight test doubles, not production responses.
  // Protocol tests use real Response objects and do not go through this adapter.
  const fetch = w.fetch;
  w.fetch = async (...args) => {
    const value = await fetch(...args);
    if (value instanceof Response) return value;
    return {...value, status:value.status ?? (value.ok === false ? 500 : 200),
      ok:value.ok ?? (value.status == null || value.status < 400), headers:value.headers || new Headers(),
      json:value.json || (async () => ({ok:value.ok}))};
  };
  if (!w.ParrotCore) w.ParrotCore = createCore(w);
  return w.ParrotCore;
}
module.exports = {installCore};
