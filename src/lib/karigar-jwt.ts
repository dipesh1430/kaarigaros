import jwt from "jsonwebtoken";

export function getKarigarJwtSecret(): string {
  const s = process.env.KARIGAR_JWT_SECRET;
  if (!s) throw new Error("KARIGAR_JWT_SECRET is not configured");
  return s;
}

export function signKarigarToken(payload: object, opts?: jwt.SignOptions) {
  return jwt.sign(payload, getKarigarJwtSecret(), opts);
}

export function verifyKarigarToken(token: string) {
  return jwt.verify(token, getKarigarJwtSecret());
}

export function getKarigarIdFromRequest(request: Request): number | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const decoded = verifyKarigarToken(token) as { karigarId?: number };
    return decoded.karigarId ?? null;
  } catch {
    return null;
  }
}
