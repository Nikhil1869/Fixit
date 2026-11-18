import { describe, it, expect } from "vitest";
import { indexMatches } from "../../scripts/lib/migration-audit.mjs";

describe("release preflight index validation", () => {
  const required = {
    key: { employeeId: 1, date: 1, time: 1 },
    unique: true,
    partialFilterExpression: { employeeId: { $type: "objectId" }, active: true },
  };
  it("rejects an index that exists with unsafe options", () => {
    expect(indexMatches({ key: required.key }, required)).toBe(false);
    expect(indexMatches({ ...required, partialFilterExpression: undefined }, required)).toBe(false);
    expect(indexMatches({ ...required, hidden: true }, required)).toBe(false);
    expect(indexMatches({ ...required, sparse: true }, required)).toBe(false);
  });
  it("checks TTL and compound key order without depending on index names", () => {
    expect(
      indexMatches(
        {
          ...required,
          name: "custom",
          partialFilterExpression: { active: true, employeeId: { $type: "objectId" } },
        },
        required,
      ),
    ).toBe(true);
    expect(indexMatches({ ...required, key: { date: 1, employeeId: 1, time: 1 } }, required)).toBe(
      false,
    );
    expect(
      indexMatches({ key: { expiresAt: 1 } }, { key: { expiresAt: 1 }, expireAfterSeconds: 0 }),
    ).toBe(false);
  });
});
