import * as OTPAuth from "otpauth";

/** Config compartida del TOTP (login en lib/auth.ts + setup en /api/admin/security/2fa/*). */
export function buildTotp(secret: string, label = "Admin") {
  return new OTPAuth.TOTP({
    issuer: "Portafolio",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}
