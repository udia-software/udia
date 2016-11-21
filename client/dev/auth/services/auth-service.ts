import {Injectable } from '@angular/core';
import {tokenNotExpired} from 'angular2-jwt';
import {myConfig} from '../auth.config';

// Avoid name not found warnings
declare let Auth0Lock: any;

@Injectable()
export class Auth {
  // Configure Auth0
  lock = new Auth0Lock(myConfig.clientID, myConfig.domain, {});

  /**
   * Construct the Auth service. If authenticated, set the Auth ID Token.
   */
  constructor() {
    // Add callback for lock 'Authenticated' event
    this.lock.on('authenticated', (authResult) => {
      localStorage.setItem('id_token', authResult.idToken);
    });
  }

  /**
   * Attempt to log in. Show the login widget.
   */
  public login() {
    this.lock.show();
  }

  /**
   * Check if there is an unexpired JWT.
   * Search localStorage for an item with the key == 'id_token'
   * @returns {boolean}
   */
  public authenticated() {
    return tokenNotExpired();
  }

  /**
   * Remove the token from localStorage
   */
  public logout() {
    localStorage.removeItem('id_token');
  }
}
