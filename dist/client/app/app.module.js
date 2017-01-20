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
 * Created by alexander on 2016-12-08.
 */
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
const forms_1 = require("@angular/forms");
const platform_browser_1 = require("@angular/platform-browser");
const ng_bootstrap_1 = require("@ng-bootstrap/ng-bootstrap");
const router_1 = require("@angular/router");
// Components
const app_component_1 = require("./app.component");
const login_component_1 = require("./account/login/login.component");
const signup_component_1 = require("./account/signup/signup.component");
const profile_component_1 = require("./account/profile/profile.component");
const thing_component_1 = require("./thing/thing.component");
const notFound_component_1 = require("./error/notFound/notFound.component");
// Services
const account_service_1 = require("./account/account.service");
const thing_service_1 = require("./thing/thing.service");
// Guards (for authentication verification)
const account_guard_1 = require("./account/account.guard");
const appRoutes = [
    { path: "", component: thing_component_1.ThingComponent },
    { path: "accounts/login", component: login_component_1.LoginComponent },
    { path: "accounts/signup", component: signup_component_1.SignupComponent },
    { path: "accounts", component: profile_component_1.ProfileComponent, canActivate: [account_guard_1.LoggedInGuard] },
    { path: "**", component: notFound_component_1.NotFoundComponent }
];
let AppModule = class AppModule {
};
AppModule = __decorate([
    core_1.NgModule({
        imports: [
            platform_browser_1.BrowserModule,
            http_1.HttpModule,
            forms_1.FormsModule,
            ng_bootstrap_1.NgbModule.forRoot(),
            router_1.RouterModule.forRoot(appRoutes)
        ],
        declarations: [
            app_component_1.AppComponent,
            login_component_1.LoginComponent,
            signup_component_1.SignupComponent,
            profile_component_1.ProfileComponent,
            thing_component_1.ThingComponent,
            notFound_component_1.NotFoundComponent
        ],
        providers: [
            thing_service_1.ThingService,
            account_service_1.AccountService,
            account_guard_1.LoggedInGuard
        ],
        bootstrap: [app_component_1.AppComponent]
    }),
    __metadata("design:paramtypes", [])
], AppModule);
exports.AppModule = AppModule;
