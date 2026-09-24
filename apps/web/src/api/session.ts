import type { SessionAuth } from './http';
import { persistentStore } from '../lib/storage';

const TOKEN_KEY = 'checkout.token';

export function createSessionAuth(createSession: () => Promise<string>): SessionAuth {
  let creating: Promise<string> | null = null;
  return {
    token() {
      const saved = persistentStore.get(TOKEN_KEY);
      if (saved) return Promise.resolve(saved);
      creating ??= createSession()
        .then((token) => {
          persistentStore.set(TOKEN_KEY, token);
          return token;
        })
        .finally(() => {
          creating = null;
        });
      return creating;
    },
    invalidate(token) {
      if (persistentStore.get(TOKEN_KEY) === token) persistentStore.remove(TOKEN_KEY);
    },
  };
}
