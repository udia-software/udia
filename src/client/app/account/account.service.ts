/**
 * Created by udia on 2017-01-07.
 */
import {Injectable} from "@angular/core";
import {Http, Headers} from "@angular/http";

@Injectable()
export class AccountService {
  private loggedIn: boolean = false;

  constructor(private http: Http) {
    this.loggedIn = !!localStorage.getItem("auth_token");
  }

  /**
   * Login to the application, set the authentication token
   * @param username {String}
   * @param password {String}
   * @returns {Observable<R>}
   */
  login(username: string, password: string) {
    let headers = new Headers();
    headers.append("Content-Type", "application/json");

    return this.http
      .post("/auth/local",
        JSON.stringify({username, password}),
        {headers}
      )
      .map(res => res.json())
      .map((res) => {
        if (res.success) {
          localStorage.setItem("auth_token", res.auth_token);
          this.loggedIn = true;
        }

        return res.success;
      });
  }

  /**
   * Log out the current user account.
   */
  logout(): void {
    localStorage.removeItem("auth_token");
    this.loggedIn = false;
  }

  /**
   * Return whether or not the account user is logged in
   * @returns {boolean}
   */
  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}