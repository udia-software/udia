import crypto from "crypto";

export function generateUserCryptoParams(email: string, uip: string) {
  const pwFunc = "pbkdf2";
  const pwDigest = "sha512";
  const pwCost = 3000; // Should be 100000 in production.
  const pwNonce = crypto.randomBytes(256).toString("hex");

  const hash = crypto.createHash("sha1");
  hash.update([email, pwNonce].join(":"));
  const pwSalt = hash.digest("hex");

  // Generate the derived key
  const { pw, mk, ak } = loginUserCryptoParams(
    uip,
    pwCost,
    pwSalt,
    pwFunc,
    pwDigest
  );
  generateKeyPairECDH();
  return { pw, mk, ak, pwSalt, pwCost, pwFunc: "pbkdf2", pwDigest };
}

export function loginUserCryptoParams(
  uip: string,
  pwCost: number,
  pwSalt: string,
  pwFunc: string,
  pwDigest: string
) {
  if (pwFunc !== "pbkdf2") {
    throw new Error(`Unsupported password function ${pwFunc}`);
  }
  const key = crypto.pbkdf2Sync(uip, pwSalt, pwCost, 768, pwDigest);
  const pw = key.slice(0, key.length / 3).toString("hex");
  const mk = key.slice(key.length / 3, key.length / 3 * 2).toString("hex");
  const ak = key.slice(key.length / 3 * 2, key.length).toString("hex");
  return { pw, mk, ak };
}

export function generateKeyPairECDH() {
  const ecdh = crypto.createECDH("prime256v1");
  const publicKey = ecdh.generateKeys("hex", "uncompressed");
  const privateKey = ecdh.getPrivateKey("hex");
  return { ecdh, publicKey, privateKey };
}
