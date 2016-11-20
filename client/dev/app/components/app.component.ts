import {Component} from '@angular/core';
import {Auth} from '../../auth/services/auth-service';

@Component({
  selector: 'udia-app',
  providers: [Auth],
  templateUrl: 'app/templates/app.html'
})

export class AppComponent {
  constructor(private auth: Auth) {
  }
}
