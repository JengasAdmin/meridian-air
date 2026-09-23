import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, CATEGORY_ELIGIBILITY, PERMISSION_GROUPS, ROLE_DEFINITIONS, expandGroups, PILOT_PROGRESSION } from "../src/lib/rbac";

describe("RBAC permission catalog", () => {
  it("builds ALL_PERMISSIONS from groups", () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThan(40);
    expect(ALL_PERMISSIONS).toContain("BOOKINGS.CREATE");
    expect(ALL_PERMISSIONS).toContain("PIREP.APPROVE");
    expect(ALL_PERMISSIONS).toContain("SYSTEM.CONFIGURE");
  });

  it("every permission matches DOMAIN.ACTION", () => {
    for (const p of ALL_PERMISSIONS) expect(p).toMatch(/^[A-Z]+\.[A-Z]+$/);
  });

  it("expandGroups expands group names and *", () => {
    expect(expandGroups(["*"])).toEqual(ALL_PERMISSIONS);
    expect(expandGroups(["PIREP"])).toEqual(["PIREP.READ", "PIREP.CREATE", "PIREP.APPROVE", "PIREP.REJECT", "PIREP.MANAGE"]);
  });

  it("roles reference existing groups", () => {
    for (const r of ROLE_DEFINITIONS) {
      for (const g of r.groups ?? []) {
        expect(g === "*" || PERMISSION_GROUPS[g] !== undefined, `${r.key}: unknown group ${g}`).toBe(true);
      }
      if (r.inherits) {
        expect(ROLE_DEFINITIONS.some((p) => p.key === r.inherits), `${r.key}: bad inherits`).toBe(true);
      }
    }
  });

  it("pilot progression covers every passenger rank", () => {
    expect(PILOT_PROGRESSION[0]).toBe("MRD_VERIFIED_PILOT");
    expect(PILOT_PROGRESSION.at(-1)).toBe("FLT_UNIVERSAL_CAPTAIN");
  });
});

describe("operation eligibility", () => {
  it("defines all five operation categories", () => {
    expect(Object.keys(CATEGORY_ELIGIBILITY).sort()).toEqual(["CARGO", "GENERAL", "MILITARY", "PASSENGER", "SOVIET"]);
  });

  it("separates military from passenger qualifications", () => {
    expect(CATEGORY_ELIGIBILITY.MILITARY).not.toContain("MRD_VERIFIED_PILOT");
    expect(CATEGORY_ELIGIBILITY.PASSENGER).not.toContain("MRD_MILITARY_PILOT");
  });

  it("universal captain may operate everything", () => {
    for (const list of Object.values(CATEGORY_ELIGIBILITY)) {
      expect(list).toContain("FLT_UNIVERSAL_CAPTAIN");
    }
  });
});
