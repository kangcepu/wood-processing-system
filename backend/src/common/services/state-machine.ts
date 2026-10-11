import { ConflictException } from "@nestjs/common";

export function assertTransition<TStatus extends string>(
  transitions: Record<TStatus, readonly TStatus[]>,
  from: TStatus,
  to: TStatus,
): void {
  const allowed = transitions[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictException({
      code: "INVALID_TRANSITION",
      message: `Transisi status dari ${from} ke ${to} tidak diizinkan`,
    });
  }
}
