/**
 * Created by alexander on 2016-12-08.
 */
import {Component, enableProdMode} from '@angular/core';

// To switch to 'development', comment the following line
enableProdMode();

@Component({
  selector: 'my-app',
  template: `<h1>Welcome to {{name}}!</h1><thing-cmp></thing-cmp>`,
})
export class AppComponent {
  name = 'Udia';
}