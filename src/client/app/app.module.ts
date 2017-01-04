/**
 * Created by alexander on 2016-12-08.
 */
import {NgModule}      from "@angular/core";
import {HttpModule} from "@angular/http";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {RouterModule, Routes} from "@angular/router";

import {AppComponent}  from "./app.component";
import {LoginComponent} from "./account/login/login.component";
import {SignupComponent} from "./account/signup/signup.component";
import {ThingComponent} from "./thing/thing.component";

import {NotFoundComponent} from "./error/notFound/notFound.component";

import {ThingService} from "./thing/thing.service";

const appRoutes: Routes = [
  {path: "", component: ThingComponent},
  {path: "login", component: LoginComponent},
  {path: "signup", component: SignupComponent},
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
    ThingComponent,
    NotFoundComponent
  ],
  providers: [
    ThingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}