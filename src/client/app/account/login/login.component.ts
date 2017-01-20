/**
 * Created by udia on 2017-01-04.
 */
import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {AccountService} from "../account.service";

@Component({
  selector: "login-cmp",
  templateUrl: "app/account/login/login.html",
  styleUrls: ["app/account/login/login.css"]
})
export class LoginComponent {
  constructor(private accountService: AccountService, private router: Router) {
  }

  onSubmit(username: string, password: string) {
    this.accountService.login(username, password).subscribe(result => {
      if (result) {
        this.router.navigate([""]);
      }
    })
  }
}