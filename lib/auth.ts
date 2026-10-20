import { timingSafeEqual } from "node:crypto";

export function codeOk(req: Request) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) return true;
  const given = req.headers.get("x-access-code");
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
