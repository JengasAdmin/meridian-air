import { describe, expect, it } from "vitest";
import { ru } from "../src/i18n/ru";
import { en } from "../src/i18n/en";

describe("i18n dictionaries", () => {
  it("RU and EN share the exact same key set", () => {
    const ruKeys = Object.keys(ru).sort();
    const enKeys = Object.keys(en).sort();
    expect(enKeys).toEqual(ruKeys);
  });

  it("has no empty translations", () => {
    for (const [k, v] of Object.entries({ ...ru, ...en })) {
      expect(String(v).length, `empty value for ${k}`).toBeGreaterThan(0);
    }
  });
});
