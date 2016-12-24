/**
 * Created by alexander on 2016-12-08.
 */
import {
  Inject,
  Injectable
} from "@angular/core";

import {
  Observable
} from "rxjs/Observable";

import {
  Http,
  Headers
} from "@angular/http";

import "rxjs/add/operator/map";

@Injectable()
export class ThingService {
  static ENDPOINT: string = "/api/things/:id";

  constructor(@Inject(Http) private _http: Http) {

  }

  getAll(): Observable<any> {
    return this._http
      .get(ThingService.ENDPOINT.replace(":id", ""))
      .map((r) => r.json());
  }

  add(message: string): Observable<any> {
    let _messageStringified = JSON.stringify({message: message});

    let headers = new Headers();

    headers.append("Content-Type", "application/json");

    return this._http
      .post(ThingService.ENDPOINT.replace(":id", ""), _messageStringified, {headers})
      .map((r) => r.json());
  }

  remove(id: string): Observable<any> {
    return this._http
      .delete(ThingService.ENDPOINT.replace(":id", id));
  }
}
