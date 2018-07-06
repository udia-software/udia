import Auth from "../../modules/Auth";

describe("Auth", () => {
  it("should handle invalid JWT", () => {
    const badJWTPayload = Auth.verifyUserJWT("badJWT");
    expect(badJWTPayload).toEqual({});
  });
});
