import {NgModule} from '@angular/core';
import {NgSemanticModule} from 'ng-semantic';
import {BrowserModule} from '@angular/platform-browser';
import {AUTH_PROVIDERS} from 'angular2-jwt';

import {HttpModule} from '@angular/http';
import {FormsModule, FormBuilder} from '@angular/forms';

import {AppComponent} from './app/components/app.component';
import {HomeComponent} from './home/components/home.component';
import {routing, appRoutingProviders} from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  providers: [
    appRoutingProviders,
    AUTH_PROVIDERS
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgSemanticModule,
    routing
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
