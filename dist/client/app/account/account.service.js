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
/**
 * Created by udia on 2017-01-07.
 */
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
let AccountService = class AccountService {
    constructor(http) {
        this.http = http;
        this.loggedIn = false;
        this.loggedIn = !!localStorage.getItem("auth_token");
    }
    /**
     * Login to the application, set the authentication token
     * @param username {String}
     * @param password {String}
     * @returns {Observable<R>}
     */
    login(username, password) {
        let headers = new http_1.Headers();
        headers.append("Content-Type", "application/json");
        return this.http
            .post("/auth/local", JSON.stringify({ username, password }), { headers })
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
    logout() {
        localStorage.removeItem("auth_token");
        this.loggedIn = false;
    }
    /**
     * Return whether or not the account user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.loggedIn;
    }
};
AccountService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http])
], AccountService);
exports.AccountService = AccountService;
