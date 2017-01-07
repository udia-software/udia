/**
 * Created by alexander on 2016-12-08.
 */
import {NgModule}      from "@angular/core";
import {HttpModule} from "@angular/http";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {RouterModule, Routes} from "@angular/router";

// Components
import {AppComponent}  from "./app.component";
import {LoginComponent} from "./account/login/login.component";
import {SignupComponent} from "./account/signup/signup.component";
import {ProfileComponent} from "./account/profile/profile.component";
import {ThingComponent} from "./thing/thing.component";
import {NotFoundComponent} from "./error/notFound/notFound.component";

// Services
import {AccountService} from "./account/account.service";
import {ThingService} from "./thing/thing.service";

// Guards (for authentication verification)
import {LoggedInGuard} from "./account/account.guard";

const appRoutes: Routes = [
  {path: "", component: ThingComponent},
  {path: "accounts/login", component: LoginComponent},
  {path: "accounts/signup", component: SignupComponent},
  {path: "accounts", component: ProfileComponent, canActivate: [LoggedInGuard]},
  {path: "**", component: NotFoundComponent}
];

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(appRoutes)
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ProfileComponent,
    ThingComponent,
    NotFoundComponent
  ],
  providers: [
    ThingService,
    AccountService,
    LoggedInGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}