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
 * Created by udia on 2017-01-04.
 */
const core_1 = require("@angular/core");
const router_1 = require("@angular/router");
const account_service_1 = require("../account.service");
let LoginComponent = class LoginComponent {
    constructor(accountService, router) {
        this.accountService = accountService;
        this.router = router;
    }
    onSubmit(username, password) {
        this.accountService.login(username, password).subscribe(result => {
            if (result) {
                this.router.navigate([""]);
            }
        });
    }
};
LoginComponent = __decorate([
    core_1.Component({
        selector: "login-cmp",
        templateUrl: "app/account/login/login.html",
        styleUrls: ["app/account/login/login.css"]
    }),
    __metadata("design:paramtypes", [account_service_1.AccountService, router_1.Router])
], LoginComponent);
exports.LoginComponent = LoginComponent;
