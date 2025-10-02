// FROZEN: true
// Responsibility: stable stringify + serialize/deserialize for Document (no UI deps)
// Contract: keys sorted, defaults allowed; version=1 only

import type { Document } from '../types/node';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (isPlainObject(value)) {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value).sort();

    for (const key of keys) {
      sorted[key] = sortValue(value[key]);
    }

    return sorted;
  }

  return value;
};

export const stableStringify = (input: unknown): string => {
  return JSON.stringify(sortValue(input));
};

export const serialize = (doc: Document): string => {
  return stableStringify(doc);
};

export const deserialize = (json: string): Document => {
  const parsed = JSON.parse(json) as unknown;

  if (!isPlainObject(parsed) || parsed.version !== 1) {
    throw new Error('Unsupported document version');
  }

  return parsed as Document;
};
