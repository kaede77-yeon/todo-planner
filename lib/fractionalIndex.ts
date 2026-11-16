import { generateKeyBetween } from "fractional-indexing";

export function keyBetween(prev: string | null, next: string | null): string {
  return generateKeyBetween(prev, next);
}

/** Key for inserting at position `index` of an already sorted list of orders. */
export function orderForInsert(sortedOrders: string[], index: number): string {
  const i = Math.max(0, Math.min(index, sortedOrders.length));
  return keyBetween(sortedOrders[i - 1] ?? null, sortedOrders[i] ?? null);
}

export function compareOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
