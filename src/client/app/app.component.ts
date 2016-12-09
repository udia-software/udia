/**
 * Created by alexander on 2016-12-08.
 */
import {Component} from '@angular/core';

@Component({
  selector: 'my-app',
  template: `<h1>Hello {{name}}</h1>`,
})
export class AppComponent {
  name = 'Angular';
}