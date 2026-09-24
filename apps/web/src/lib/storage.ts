export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  getJson<T>(key: string): T | null;
  setJson(key: string, value: unknown): void;
}

function createStore(area: () => Storage): KeyValueStore {
  const store: KeyValueStore = {
    get(key) {
      try {
        return area().getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        area().setItem(key, value);
      } catch {}
    },
    remove(key) {
      try {
        area().removeItem(key);
      } catch {}
    },
    getJson<T>(key: string) {
      const raw = store.get(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    setJson(key, value) {
      store.set(key, JSON.stringify(value));
    },
  };
  return store;
}

export const persistentStore = createStore(() => window.localStorage);
export const tabStore = createStore(() => window.sessionStorage);
