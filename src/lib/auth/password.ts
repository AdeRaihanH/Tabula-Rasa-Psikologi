import bcrypt from "bcryptjs";

const RONDE = 10;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, RONDE);
}

export async function verifikasiPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
