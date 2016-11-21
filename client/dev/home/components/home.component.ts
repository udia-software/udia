import {Component} from '@angular/core';
import {Auth} from '../../auth/services/auth-service';

@Component({
  selector: 'home',
  templateUrl: 'home/templates/home.html'
})

export class HomeComponent {
  constructor(private auth: Auth) {
  }
}
