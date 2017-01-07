/**
 * Created by udia on 2017-01-07.
 */
import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {AccountService} from './account.service';

@Injectable()
export class LoggedInGuard implements CanActivate {
  constructor(private account: AccountService) {
  }

  canActivate() {
    return this.account.isLoggedIn();
  }
}