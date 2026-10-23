/** Optional persistence: blocked/full storage must never block the operation. */
export function safeStorage(resolve) {
  const memory = new Map();
  const removed = new Set();
  const backend = () => { try { return resolve(); } catch { return null; } };
  const keys = () => {
    const found = new Set(memory.keys());
    try { const store = backend(); for (let i = 0; i < (store?.length || 0); i++) found.add(store.key(i)); } catch {}
    return [...found].filter(key => key && !removed.has(key));
  };
  return {
    getItem(key) { if (removed.has(key)) return null; if (memory.has(key)) return memory.get(key); try { return backend()?.getItem(key) ?? null; } catch { return null; } },
    setItem(key, value) { removed.delete(key); memory.set(key, String(value)); try { backend()?.setItem(key, String(value)); } catch {} },
    removeItem(key) { removed.add(key); memory.delete(key); try { backend()?.removeItem(key); } catch {} },
    key(index) { return keys()[index] ?? null; },
    get length() { return keys().length; },
    removePrefix(prefix) { for (const key of keys()) if (key.startsWith(prefix)) this.removeItem(key); }
  };
}

export function createStorage(root) {
  const local = safeStorage(() => root.localStorage), session = safeStorage(() => root.sessionStorage);
  return {local, session, clearPrivate(accountId) {
    if (!accountId) return;
    session.removePrefix(`parrot669-draft:${accountId}:`);
    session.removeItem(`parrot669-host-return:${accountId}`);
    session.removeItem("parrot669-profile-return");
  }};
}
