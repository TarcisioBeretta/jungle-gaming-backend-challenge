import { createHash } from 'node:crypto';

export class PayloadHash {
  static from<T>(payload: T): string {
    const normalized = this.normalize(payload);
    return this.sha256(normalized);
  }

  private static normalize<T>(value: T): string {
    return JSON.stringify(this.sortValue(value));
  }

  private static sortValue<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item)) as T;
    }

    if (value !== null && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this.sortValue((value as Record<string, unknown>)[key]);
          return acc;
        }, {}) as T;
    }

    return value;
  }

  private static sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
