/**
 * Created by alexander on 2016-12-08.
 */
import {Component, OnInit} from '@angular/core';

import {ThingService} from "./thing.service";

type Thing = {
  message: string;
  _id?: string;
}

@Component({
  selector: 'thing-cmp',
  templateUrl: 'app/thing/thing.html',
  styleUrls: ['app/thing/thing.css']
})
export class ThingComponent implements OnInit {
  title: string = "Things";
  things: Thing[] = [];
  thingForm: Thing;

  constructor(private _thingService: ThingService) {
    this.thingForm = {
      "message": "",
    };
  }

  ngOnInit() {
    this._getAll();
  }

  private _getAll(): void {
    this._thingService
      .getAll()
      .subscribe((things) => {
        this.things = things;
      });
  }

  add(message: string): void {
    this._thingService
      .add(message)
      .subscribe((m) => {
        this.things.push(m);
        this.thingForm.message = "";
      });
  }

  remove(id: string): void {
    this._thingService
      .remove(id)
      .subscribe(() => {
        this.things.forEach((t, i) => {
          if (t._id === id)
            return this.things.splice(i, 1);
        });
      })
  }
}
