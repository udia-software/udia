/**
 * Created by udia on 2017-01-04.
 */
import {Component} from "@angular/core";
import { Router } from "@angular/router";
import { Http } from "@angular/http";

@Component({
  selector: "signup-cmp",
  templateUrl: "app/account/signup/signup.html",
  styleUrls: ["app/account/signup/signup.css"]
})
export class SignupComponent {
  error = false;
  constructor(public router: Router, public http: Http) {
  }

  signup(event: Event, username: string, password: string) {
    event.preventDefault();
    this.http.post("/api/users", {username, password})
      .subscribe(
        response => {
          localStorage.setItem("auth_token", response.json().id_token);
          this.router.navigate([""]);
        },
        error => {
          this.error = true;
          console.log(error.text());
        }
      );
  }

  login(event: Event) {
    event.preventDefault();
    this.router.navigate(["login"]);
  }

}