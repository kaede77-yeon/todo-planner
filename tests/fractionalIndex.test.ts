import { describe, expect, it } from "vitest";
import { keyBetween, orderForInsert } from "@/lib/fractionalIndex";

describe("fractionalIndex", () => {
  it("keyBetween null,null gives a key", () => {
    expect(typeof keyBetween(null, null)).toBe("string");
  });
  it("into empty list", () => {
    expect(orderForInsert([], 0)).toBe(keyBetween(null, null));
  });
  it("insert at start", () => {
    expect(orderForInsert(["a0", "a1"], 0) < "a0").toBe(true);
  });
  it("insert at end", () => {
    expect(orderForInsert(["a0", "a1"], 2) > "a1").toBe(true);
  });
  it("insert in middle", () => {
    const k = orderForInsert(["a0", "a1"], 1);
    expect(k > "a0" && k < "a1").toBe(true);
  });
  it("stays lexicographic after many inserts", () => {
    let list: string[] = [];
    for (let n = 0; n < 200; n++) {
      const idx =
        n % 3 === 0 ? 0 : n % 3 === 1 ? list.length : Math.floor(list.length / 2);
      const k = orderForInsert(list, idx);
      list = [...list.slice(0, idx), k, ...list.slice(idx)];
    }
    const sorted = [...list].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    expect(list).toEqual(sorted);
    expect(new Set(list).size).toBe(list.length);
  });
});
