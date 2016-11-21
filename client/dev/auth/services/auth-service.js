"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var angular2_jwt_1 = require('angular2-jwt');
var auth_config_1 = require('../auth.config');
var Auth = (function () {
    /**
     * Construct the Auth service. If authenticated, set the Auth ID Token.
     */
    function Auth() {
        // Configure Auth0
        this.lock = new Auth0Lock(auth_config_1.myConfig.clientID, auth_config_1.myConfig.domain, {});
        // Add callback for lock 'Authenticated' event
        this.lock.on('authenticated', function (authResult) {
            localStorage.setItem('id_token', authResult.idToken);
        });
    }
    /**
     * Attempt to log in. Show the login widget.
     */
    Auth.prototype.login = function () {
        this.lock.show();
    };
    /**
     * Check if there is an unexpired JWT.
     * Search localStorage for an item with the key == 'id_token'
     * @returns {boolean}
     */
    Auth.prototype.authenticated = function () {
        return angular2_jwt_1.tokenNotExpired();
    };
    /**
     * Remove the token from localStorage
     */
    Auth.prototype.logout = function () {
        localStorage.removeItem('id_token');
    };
    Auth = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], Auth);
    return Auth;
}());
exports.Auth = Auth;
