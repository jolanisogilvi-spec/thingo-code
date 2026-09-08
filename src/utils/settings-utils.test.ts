import { describe, expect, it } from "vitest";
import { getFirstAvailablePath } from "./settings-utils";

describe("getFirstAvailablePath", () => {
  it("uses the canonical single-agent settings page", () => {
    expect(getFirstAvailablePath(undefined)).toBe("/settings/agent");
  });
});
