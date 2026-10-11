import { ConflictException } from "@nestjs/common";
import { assertTransition } from "./state-machine";

type Status = "DRAFT" | "REVIEW" | "APPROVED";

const TRANSITIONS: Record<Status, readonly Status[]> = {
  DRAFT: ["REVIEW"],
  REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: [],
};

describe("assertTransition", () => {
  it("allows a transition present in the map", () => {
    expect(() => assertTransition(TRANSITIONS, "DRAFT", "REVIEW")).not.toThrow();
  });

  it("rejects a transition not present in the map", () => {
    expect(() => assertTransition(TRANSITIONS, "DRAFT", "APPROVED")).toThrow(ConflictException);
  });

  it("rejects any transition from a terminal state", () => {
    expect(() => assertTransition(TRANSITIONS, "APPROVED", "DRAFT")).toThrow(ConflictException);
  });
});
