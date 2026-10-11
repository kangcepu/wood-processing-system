import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TokenService {
  generateRefreshToken(): { raw: string; hash: string } {
    const raw = randomBytes(48).toString("base64url");
    return { raw, hash: this.hashRefreshToken(raw) };
  }

  hashRefreshToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
