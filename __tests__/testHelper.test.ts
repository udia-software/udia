import crypto from "crypto";
import Auth from "../src/modules/Auth";
import {
  deriveSubKeysFromUserInputPassword,
  generateKeyPairECDH,
  generateUserCryptoParams
} from "./testHelper";

describe("TestHelper", () => {
  it("should generate predictable parameters", () => {
    const email = "testHelper@udia.ca";
    const userInputtedPassword = "T3st1ing the Helper!";
    const {
      pw: upw,
      mk: umk,
      ak: uak,
      pwNonce,
      pwCost,
      pwFunc,
      pwDigest,
      pwKeySize
    } = generateUserCryptoParams(email, userInputtedPassword);
    const hash = crypto.createHash("sha1");
    hash.update([email, pwNonce].join(":"));
    const pwSalt = hash.digest("base64");
    const { pw: lpw, mk: lmk, ak: lak } = deriveSubKeysFromUserInputPassword({
      uip: userInputtedPassword,
      pwCost,
      pwSalt,
      pwFunc,
      pwDigest,
      pwKeySize
    });
    expect(upw).toEqual(lpw);
    expect(umk).toEqual(lmk);
    expect(uak).toEqual(lak);
  });

  it("should perform server side hash/verify", async done => {
    const hashedPasswordStub = `695e4761dd4694a3a475243f202ea7239ff9f57fac`;
    const hash = await Auth.hashPassword(hashedPasswordStub);
    expect(await Auth.verifyPassword(hash, hashedPasswordStub)).toBe(true);
    done();
  });

  it("should generate valid public/private key pair", () => {
    const {
      ecdh: a,
      publicKey: aPub,
      privateKey: aPriv
    } = generateKeyPairECDH();
    const {
      ecdh: b,
      publicKey: bPub,
      privateKey: bPriv
    } = generateKeyPairECDH();
    // console.log(a, aPub, aPriv)
    // console.log(b, bPub, bPriv)
    // Exchange and generate the secret...
    const aliceSecret = a.computeSecret(bPub, "hex");
    const bobSecret = b.computeSecret(aPub, "hex");
    // console.log(aliceSecret.toString("hex"));
    // console.log(bobSecret.toString("hex"));
    expect(aliceSecret.toString("hex")).toEqual(bobSecret.toString("hex"));
    expect(aPriv).not.toEqual(bPriv);
  });
});
