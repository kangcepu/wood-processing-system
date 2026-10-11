import { TokenService } from "./token.service";

describe("TokenService", () => {
  const tokenService = new TokenService();

  it("generates a raw token whose hash matches hashRefreshToken", () => {
    const { raw, hash } = tokenService.generateRefreshToken();
    expect(tokenService.hashRefreshToken(raw)).toBe(hash);
  });

  it("generates unique raw tokens on each call", () => {
    const first = tokenService.generateRefreshToken();
    const second = tokenService.generateRefreshToken();
    expect(first.raw).not.toBe(second.raw);
    expect(first.hash).not.toBe(second.hash);
  });

  it("hashing is deterministic for the same raw token", () => {
    const { raw } = tokenService.generateRefreshToken();
    expect(tokenService.hashRefreshToken(raw)).toBe(tokenService.hashRefreshToken(raw));
  });
});
