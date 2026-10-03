import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/**
 * Password hashing with Node's built-in scrypt (memory-hard, no native addon to compile).
 * Stored format: scrypt$N$r$p$saltB64$hashB64 so parameters can be raised later.
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const
const KEY_LEN = 64
const MAX_MEM = 64 * 1024 * 1024

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  opts: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, KEY_LEN, { ...PARAMS, maxmem: MAX_MEM })
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split('$')
  if (algo !== 'scrypt' || !n || !r || !p || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEM,
  })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

/** A real hash of a random password, used to keep login timing constant for unknown emails. */
let dummyHash: Promise<string> | undefined
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'))
  return dummyHash
}
