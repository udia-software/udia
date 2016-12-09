/**
 * Created by alexander on 2016-12-08.
 */
import {NgModule}      from '@angular/core';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent}  from './app.component';
import {ThingComponent} from './thing/thing.component';

import {ThingService} from './thing/thing.service';

@NgModule({
  imports: [BrowserModule, HttpModule, FormsModule],
  declarations: [
    AppComponent,
    ThingComponent
  ],
  providers: [
    ThingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}