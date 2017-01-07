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
  constructor(public router: Router, public http: Http) {
  }

  signup(event: Event, username: string, password: string) {
    event.preventDefault();
    let body = JSON.stringify({ username, password });
    console.log(body);
    this.http.post("/api/users", body)
      .subscribe(
        response => {
          localStorage.setItem("auth_token", response.json().id_token);
          this.router.navigate(["home"]);
        },
        error => {
          alert(error.text());
          console.log(error.text());
        }
      );
  }

  login(event: Event) {
    event.preventDefault();
    this.router.navigate(["login"]);
  }

}