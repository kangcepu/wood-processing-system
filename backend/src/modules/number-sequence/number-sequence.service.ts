import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NumberSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(prefix: string, padLength = 6): Promise<string> {
    const year = new Date().getUTCFullYear();
    const key = `${prefix}:${year}`;

    const sequence = await this.prisma.numberSequence.upsert({
      where: { key },
      create: { key, prefix, padLength, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });

    const padded = String(sequence.lastValue).padStart(sequence.padLength, "0");
    return `${prefix}-${year}-${padded}`;
  }
}
