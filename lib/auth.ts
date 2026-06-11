import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// Hash de la clave personal de cada participante. NUNCA se guarda en texto plano.
// Formato almacenado: "<salt hex>:<hash hex>". Se usa scrypt + salt aleatorio.

export function hashClave(clave: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(clave, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyClave(clave: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  let actual: Buffer;
  try {
    actual = scryptSync(clave, salt, 64);
  } catch {
    return false;
  }
  // timingSafeEqual exige longitudes iguales
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Normaliza el nombre para usarlo como identificador estable (clave primaria). */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
