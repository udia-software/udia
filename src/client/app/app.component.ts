/**
 * Created by alexander on 2016-12-08.
 */
import {Component, enableProdMode} from "@angular/core";

// To switch to 'development', comment the following line
enableProdMode();

@Component({
  selector: "my-app",
  templateUrl: "app/app.html",
  styleUrls: ["app/app.css"]
})
export class AppComponent {
  name = "Udia";
}