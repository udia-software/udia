/**
 * Created by alexander on 2016-12-24.
 */
import * as jwt from "jsonwebtoken";

export class AuthService {
  private SESSION_SECRET: string = process.env.SESSION_SECRET || "SECRET_GOES_HERE";

  public signToken(id: string, role: string) {
    return jwt.sign({_id: id, role}, this.SESSION_SECRET, {
      expiresIn: 60 * 60 * 5
    });
  }
}
