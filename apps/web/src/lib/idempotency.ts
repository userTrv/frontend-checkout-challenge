import { ApiError } from '../api';
import type { KeyValueStore } from './storage';

export interface UnansweredRequest<Body> {
  key: string;
  body: Body;
}

interface Persistence {
  store: KeyValueStore;
  key: string;
}

export class IdempotentRequest<Body> {
  private pending: UnansweredRequest<Body> | null;
  private pendingJson: string | null;

  constructor(private readonly persistence?: Persistence) {
    this.pending = persistence?.store.getJson<UnansweredRequest<Body>>(persistence.key) ?? null;
    this.pendingJson = this.pending && JSON.stringify(this.pending.body);
  }

  get unanswered(): UnansweredRequest<Body> | null {
    return this.pending;
  }

  async send<Result>(
    body: Body,
    request: (body: Body, idempotencyKey: string) => Promise<Result>,
  ): Promise<Result> {
    const json = JSON.stringify(body);
    if (!this.pending || this.pendingJson !== json) {
      this.remember({ key: crypto.randomUUID(), body }, json);
    }
    const { key } = this.pending!;
    try {
      const result = await request(body, key);
      this.remember(null, null);
      return result;
    } catch (error) {
      if (!(error instanceof ApiError && error.isOutcomeUnknown)) this.remember(null, null);
      throw error;
    }
  }

  private remember(pending: UnansweredRequest<Body> | null, json: string | null) {
    this.pending = pending;
    this.pendingJson = json;
    if (!this.persistence) return;
    if (pending) this.persistence.store.setJson(this.persistence.key, pending);
    else this.persistence.store.remove(this.persistence.key);
  }
}
