// Meridian AIR RBAC — explicit permission catalog.
// Format: DOMAIN.ACTION. Roles never grant power by name alone: every role is
// wired to permission groups in the database (see prisma/seed.ts).

export const PERMISSION_GROUPS: Record<string, string[]> = {
  PILOTS: ["READ", "EDIT", "DELETE", "VERIFY", "MANAGE"],
  BOOKINGS: ["READ", "CREATE", "EDIT", "CANCEL", "MANAGE"],
  PIREP: ["READ", "CREATE", "APPROVE", "REJECT", "MANAGE"],
  FLEET: ["READ", "CREATE", "EDIT", "DELETE", "MANAGE"],
  ROUTES: ["READ", "CREATE", "EDIT", "DELETE"],
  HUB: ["READ", "MANAGE"],
  TRAINING: ["READ", "MANAGE", "APPROVE"],
  MILITARY: ["READ", "MANAGE"],
  CARGO: ["READ", "MANAGE"],
  GENERAL: ["READ", "MANAGE"],
  DISCORD: ["READ", "MANAGE"],
  USERS: ["READ", "MANAGE"],
  ROLES: ["READ", "MANAGE"],
  SYSTEM: ["READ", "CONFIGURE"],
  NEWS: ["READ", "CREATE", "EDIT", "DELETE"],
  ANALYTICS: ["READ"],
  EVENTS: ["READ", "MANAGE"],
  AUDIT: ["READ"],
  PERSONNEL: ["READ", "MANAGE"],
};

export const ALL_PERMISSIONS: string[] = Object.entries(PERMISSION_GROUPS).flatMap(
  ([domain, actions]) => actions.map((a) => `${domain}.${a}`)
);

// Permission group → role key mapping used by the seed.
// "hub" entries are granted per-hub (scoped UserRole rows).
export const ROLE_DEFINITIONS: {
  key: string;
  nameRu: string;
  nameEn: string;
  department: string;
  rank: number;
  isPilotRank?: boolean;
  inherits?: string;
  groups?: string[]; // permission domains with all actions, e.g. ["BOOKINGS", "PIREP"]
  hubScoped?: boolean;
}[] = [
  // ── GEN — executive ─────────────────────────────────────────────
  { key: "GEN_PRESIDENT", nameRu: "GEN | President", nameEn: "GEN | President", department: "GEN", rank: 1,
    groups: ["*"] },
  { key: "GEN_FIRST_VP", nameRu: "GEN | First Vice President", nameEn: "GEN | First Vice President", department: "GEN", rank: 2,
    inherits: "GEN_PRESIDENT" },
  { key: "GEN_VP", nameRu: "GEN | Vice President", nameEn: "GEN | Vice President", department: "GEN", rank: 3,
    inherits: "GEN_FIRST_VP" },
  { key: "GEN_GENERAL_DIRECTOR", nameRu: "GEN | General Director", nameEn: "GEN | General Director", department: "GEN", rank: 4,
    inherits: "GEN_VP" },
  { key: "GEN_DEPUTY_GD", nameRu: "GEN | Deputy General Director", nameEn: "GEN | Deputy General Director", department: "GEN", rank: 5,
    inherits: "GEN_GENERAL_DIRECTOR" },
  { key: "GEN_EXEC_DIRECTOR", nameRu: "GEN | Executive Director", nameEn: "GEN | Executive Director", department: "GEN", rank: 6,
    groups: ["USERS", "PERSONNEL", "ANALYTICS", "NEWS", "EVENTS", "AUDIT", "PILOTS", "BOOKINGS", "PIREP"] },
  { key: "GEN_COO", nameRu: "GEN | Chief Operating Officer", nameEn: "GEN | Chief Operating Officer", department: "GEN", rank: 7,
    groups: ["BOOKINGS", "PIREP", "FLEET", "ROUTES", "HUB", "ANALYTICS", "EVENTS"] },
  { key: "GEN_HR", nameRu: "GEN | Human Resources Director", nameEn: "GEN | Human Resources Director", department: "GEN", rank: 8,
    groups: ["PERSONNEL", "USERS", "PILOTS"] },
  { key: "GEN_CTO", nameRu: "GEN | Chief Technology Officer", nameEn: "GEN | Chief Technology Officer", department: "GEN", rank: 8,
    groups: ["SYSTEM", "USERS", "DISCORD", "ROLES"] },
  { key: "GEN_CMO", nameRu: "GEN | Chief Growth & Media Officer", nameEn: "GEN | Chief Growth & Media Officer", department: "GEN", rank: 8,
    groups: ["NEWS", "EVENTS", "ANALYTICS"] },
  { key: "GEN_MIL_CHIEF", nameRu: "GEN | Chief of Military Aviation Officer", nameEn: "GEN | Chief of Military Aviation Officer", department: "GEN", rank: 8,
    groups: ["MILITARY", "FLEET", "ROUTES"] },
  { key: "GEN_CARGO_CHIEF", nameRu: "GEN | Chief of Cargo Aviation Officer", nameEn: "GEN | Chief of Cargo Aviation Officer", department: "GEN", rank: 8,
    groups: ["CARGO", "FLEET", "ROUTES"] },
  { key: "GEN_CFI", nameRu: "GEN | Chief Flight Instructor Officer", nameEn: "GEN | Chief Flight Instructor Officer", department: "GEN", rank: 8,
    groups: ["TRAINING", "PIREP"] },
  { key: "GEN_ORG", nameRu: "GEN | Meridian Virtual Airlines", nameEn: "GEN | Meridian Virtual Airlines", department: "GEN", rank: 99,
    groups: [] }, // organizational designation, no powers by design

  // ── Departments ─────────────────────────────────────────────────
  { key: "MRD_HEAD_FCC", nameRu: "MRD | Head Flight Control Center", nameEn: "MRD | Head Flight Control Center", department: "MRD", rank: 10,
    groups: ["BOOKINGS", "PIREP", "ANALYTICS", "FLEET", "ROUTES"] },
  { key: "MRD_FLIGHT_SUPERVISOR", nameRu: "MRD | Flight Supervisor", nameEn: "MRD | Flight Supervisor", department: "MRD", rank: 20,
    groups: ["BOOKINGS", "PIREP"] },
  { key: "MRD_HEAD_PERSONNEL", nameRu: "MRD | Head of Personnel Department", nameEn: "MRD | Head of Personnel Department", department: "MRD", rank: 10,
    groups: ["PERSONNEL", "PILOTS", "USERS"] },
  { key: "MRD_PERSONNEL", nameRu: "MRD | Personnel Department", nameEn: "MRD | Personnel Department", department: "MRD", rank: 25,
    inherits: "MRD_HEAD_PERSONNEL" },
  { key: "MRD_HEAD_EVENTS", nameRu: "MRD | Head of Events", nameEn: "MRD | Head of Events", department: "MRD", rank: 12,
    groups: ["EVENTS", "NEWS"] },
  { key: "MRD_HEAD_TRAINING", nameRu: "MRD | Head of Flight Training", nameEn: "MRD | Head of Flight Training", department: "MRD", rank: 10,
    groups: ["TRAINING", "PIREP"] },
  { key: "MRD_CHIEF_INSTRUCTOR", nameRu: "MRD | Chief Instructor", nameEn: "MRD | Chief Instructor", department: "MRD", rank: 15,
    groups: ["TRAINING"] },
  { key: "MRD_INSTRUCTOR", nameRu: "MRD | Instructor", nameEn: "MRD | Instructor", department: "MRD", rank: 30,
    groups: ["TRAINING"] },
  { key: "MRD_SENIOR_INSTRUCTOR", nameRu: "MRD | Senior Instructor", nameEn: "MRD | Senior Instructor", department: "MRD", rank: 22,
    inherits: "MRD_INSTRUCTOR" },
  { key: "MRD_HEAD_MIL", nameRu: "MRD | Head of Military Aviation", nameEn: "MRD | Head of Military Aviation", department: "MRD", rank: 10,
    groups: ["MILITARY", "FLEET", "ROUTES"] },
  { key: "MRD_HEAD_CARGO", nameRu: "MRD | Head of Cargo Aviation", nameEn: "MRD | Head of Cargo Aviation", department: "MRD", rank: 10,
    groups: ["CARGO", "FLEET", "ROUTES"] },
  { key: "MRD_CARGO_LOGISTICS", nameRu: "MRD | Cargo Operations & Logistics", nameEn: "MRD | Cargo Operations & Logistics", department: "MRD", rank: 25,
    groups: ["CARGO"] },
  { key: "ADM_CHIEF", nameRu: "ADM | Chief Administrator", nameEn: "ADM | Chief Administrator", department: "ADM", rank: 10,
    groups: ["USERS", "PILOTS", "BOOKINGS", "PIREP", "AUDIT"] },
  { key: "ADM_ADMIN", nameRu: "ADM | Administrator", nameEn: "ADM | Administrator", department: "ADM", rank: 30,
    inherits: "ADM_CHIEF" },
  { key: "TECH_LEAD_DEV", nameRu: "DEV | Lead Developer", nameEn: "DEV | Lead Developer", department: "TECH", rank: 10,
    groups: ["SYSTEM", "DISCORD"] },
  { key: "TECH_ADMIN", nameRu: "TECH | Technical Administrator", nameEn: "TECH | Technical Administrator", department: "TECH", rank: 20,
    groups: ["DISCORD", "SYSTEM"] },
  { key: "TECH_SYSADMIN", nameRu: "TECH | Sys Admin", nameEn: "TECH | Sys Admin", department: "TECH", rank: 25,
    groups: ["DISCORD"] },
  { key: "PR_HEAD", nameRu: "PR | Head PR Manager", nameEn: "PR | Head PR Manager", department: "PR", rank: 10,
    groups: ["NEWS", "EVENTS"] },
  { key: "PR_MANAGER", nameRu: "PR | PR Manager", nameEn: "PR | PR Manager", department: "PR", rank: 25,
    inherits: "PR_HEAD" },
  { key: "VAT_STAFF", nameRu: "VAT | VATSIM STAFF", nameEn: "VAT | VATSIM STAFF", department: "VAT", rank: 30,
    groups: ["ANALYTICS"] },

  // ── Hub management (granted scoped per hub) ─────────────────────
  { key: "HUB_DIRECTOR", nameRu: "MRD | Hub Director", nameEn: "MRD | Hub Director", department: "MRD", rank: 15, hubScoped: true,
    groups: ["HUB", "BOOKINGS", "PIREP", "ROUTES", "FLEET", "ANALYTICS", "EVENTS"] },
  { key: "HUB_DEPUTY", nameRu: "MRD | Deputy Hub Director", nameEn: "MRD | Deputy Hub Director", department: "MRD", rank: 22, hubScoped: true,
    inherits: "HUB_DIRECTOR" },

  // ── Pilot ranks (progression; also drive booking eligibility) ───
  { key: "FLT_UNIVERSAL_CAPTAIN", nameRu: "FLT | Universal Captain", nameEn: "FLT | Universal Captain", department: "FLT", rank: 60, isPilotRank: true,
    groups: ["PILOTS"] },
  { key: "FLT_SENIOR_CAPTAIN", nameRu: "FLT | Senior Captain", nameEn: "FLT | Senior Captain", department: "FLT", rank: 61, isPilotRank: true,
    inherits: "FLT_UNIVERSAL_CAPTAIN" },
  { key: "FLT_CAPTAIN", nameRu: "FLT | Captain", nameEn: "FLT | Captain", department: "FLT", rank: 62, isPilotRank: true,
    inherits: "FLT_SENIOR_CAPTAIN" },
  { key: "FLT_SENIOR_FO", nameRu: "FLT | Senior First Officer", nameEn: "FLT | Senior First Officer", department: "FLT", rank: 63, isPilotRank: true,
    inherits: "FLT_CAPTAIN" },
  { key: "FLT_FIRST_OFFICER", nameRu: "FLT | First Officer", nameEn: "FLT | First Officer", department: "FLT", rank: 64, isPilotRank: true,
    inherits: "FLT_SENIOR_FO" },
  { key: "MRD_VERIFIED_PILOT", nameRu: "MRD | Verified Pilot", nameEn: "MRD | Verified Pilot", department: "FLT", rank: 65, isPilotRank: true,
    inherits: "FLT_FIRST_OFFICER" },
  { key: "MRD_CARGO_PILOT", nameRu: "MRD | Cargo Pilot", nameEn: "MRD | Cargo Pilot", department: "FLT", rank: 64, isPilotRank: true },
  { key: "MRD_SENIOR_CARGO_PILOT", nameRu: "MRD | Senior Cargo Pilot", nameEn: "MRD | Senior Cargo Pilot", department: "FLT", rank: 62, isPilotRank: true,
    inherits: "MRD_CARGO_PILOT" },
  { key: "MRD_MILITARY_PILOT", nameRu: "MRD | Military Pilot", nameEn: "MRD | Military Pilot", department: "FLT", rank: 64, isPilotRank: true },
  { key: "MRD_SENIOR_MILITARY_PILOT", nameRu: "MRD | Senior Military Pilot", nameEn: "MRD | Senior Military Pilot", department: "FLT", rank: 62, isPilotRank: true,
    inherits: "MRD_MILITARY_PILOT" },
  { key: "MRD_SQ1", nameRu: "MRD | 1st Squadron Military", nameEn: "MRD | 1st Squadron Military", department: "FLT", rank: 63, isPilotRank: true,
    inherits: "MRD_MILITARY_PILOT" },
  { key: "MRD_SQ2", nameRu: "MRD | 2nd Squadron Military", nameEn: "MRD | 2nd Squadron Military", department: "FLT", rank: 63, isPilotRank: true,
    inherits: "MRD_MILITARY_PILOT" },
  { key: "MRD_SQ1_CMDR", nameRu: "MRD | Squadron Commander — 1st", nameEn: "MRD | Squadron Commander — 1st", department: "MRD", rank: 20,
    groups: ["MILITARY"] },
  { key: "MRD_SQ2_CMDR", nameRu: "MRD | Squadron Commander — 2nd", nameEn: "MRD | Squadron Commander — 2nd", department: "MRD", rank: 20,
    groups: ["MILITARY"] },
  { key: "ENG_INTERNATIONAL", nameRu: "ENG | International Pilot", nameEn: "ENG | International Pilot", department: "ENG", rank: 66, isPilotRank: true },
];

/** Rank ordering for progression: lower value = higher rank. */
export const PILOT_PROGRESSION = [
  "MRD_VERIFIED_PILOT",
  "FLT_FIRST_OFFICER",
  "FLT_SENIOR_FO",
  "FLT_CAPTAIN",
  "FLT_SENIOR_CAPTAIN",
  "FLT_UNIVERSAL_CAPTAIN",
];

export const HUB_CODES = ["UMKK", "UUEE", "OMDB", "LTFM", "UHHH"];

export const OPERATION_CATEGORIES = ["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"] as const;
export type OperationCategory = (typeof OPERATION_CATEGORIES)[number];

/** Which pilot-role keys may book which operation category. */
export const CATEGORY_ELIGIBILITY: Record<OperationCategory, string[]> = {
  PASSENGER: ["MRD_VERIFIED_PILOT", "FLT_FIRST_OFFICER", "FLT_SENIOR_FO", "FLT_CAPTAIN", "FLT_SENIOR_CAPTAIN", "FLT_UNIVERSAL_CAPTAIN", "ENG_INTERNATIONAL"],
  CARGO: ["MRD_CARGO_PILOT", "MRD_SENIOR_CARGO_PILOT", "FLT_CAPTAIN", "FLT_SENIOR_CAPTAIN", "FLT_UNIVERSAL_CAPTAIN"],
  MILITARY: ["MRD_MILITARY_PILOT", "MRD_SENIOR_MILITARY_PILOT", "MRD_SQ1", "MRD_SQ2", "FLT_UNIVERSAL_CAPTAIN"],
  GENERAL: ["MRD_VERIFIED_PILOT", "FLT_FIRST_OFFICER", "FLT_SENIOR_FO", "FLT_CAPTAIN", "FLT_SENIOR_CAPTAIN", "FLT_UNIVERSAL_CAPTAIN", "ENG_INTERNATIONAL", "MRD_CARGO_PILOT", "MRD_MILITARY_PILOT"],
  SOVIET: ["MRD_VERIFIED_PILOT", "FLT_FIRST_OFFICER", "FLT_SENIOR_FO", "FLT_CAPTAIN", "FLT_SENIOR_CAPTAIN", "FLT_UNIVERSAL_CAPTAIN", "ENG_INTERNATIONAL", "MRD_CARGO_PILOT", "MRD_MILITARY_PILOT"],
};

export function expandGroups(groups: string[]): string[] {
  const out = new Set<string>();
  for (const g of groups) {
    if (g === "*") ALL_PERMISSIONS.forEach((p) => out.add(p));
    else (PERMISSION_GROUPS[g] ?? []).forEach((a) => out.add(`${g}.${a}`));
  }
  return [...out];
}
