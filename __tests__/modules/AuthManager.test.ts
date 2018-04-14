import AuthManager from "../../src/modules/Auth";

describe("AuthManager", () => {
  it("should handle invalid JWT", () => {
    const badJWTPayload = AuthManager.verifyUserJWT("badJWT");
    expect(badJWTPayload).toBeNull();
  });
});
