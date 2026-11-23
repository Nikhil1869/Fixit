import { it, expect } from "vitest";
import { readdirSync } from "node:fs";
import {
  getAllServiceCategories,
  getServicesByCategory,
  getServiceByName,
} from "@/data/homeservices";
it("uses existing case-correct assets and consistent service names", () => {
  const assets = new Set(readdirSync("public"));
  for (const category of getAllServiceCategories()) {
    for (const service of getServicesByCategory(category)) {
      expect(getServiceByName(service.name)).toEqual(service);
      expect(assets.has(service.image.slice(1)), service.image).toBe(true);
      expect(assets.has(service.icon.slice(1)), service.icon).toBe(true);
    }
  }
});
it("does not treat object prototype properties as categories", () => {
  expect(getServicesByCategory("__proto__")).toEqual([]);
  expect(getServicesByCategory("constructor")).toEqual([]);
});
