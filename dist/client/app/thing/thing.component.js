"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * Created by alexander on 2016-12-08.
 */
const core_1 = require("@angular/core");
const thing_service_1 = require("./thing.service");
let ThingComponent = class ThingComponent {
    constructor(_thingService) {
        this._thingService = _thingService;
        this.title = "Things";
        this.things = [];
        this.thingForm = {
            "message": "",
        };
    }
    ngOnInit() {
        this._getAll();
    }
    _getAll() {
        this._thingService
            .getAll()
            .subscribe((things) => {
            this.things = things;
        });
    }
    add(message) {
        this._thingService
            .add(message)
            .subscribe((m) => {
            this.things.push(m);
            this.thingForm.message = "";
        });
    }
    remove(id) {
        this._thingService
            .remove(id)
            .subscribe(() => {
            this.things.forEach((t, i) => {
                if (t._id === id)
                    return this.things.splice(i, 1);
            });
        });
    }
};
ThingComponent = __decorate([
    core_1.Component({
        selector: "thing-cmp",
        templateUrl: "app/thing/thing.html",
        styleUrls: ["app/thing/thing.css"]
    }),
    __metadata("design:paramtypes", [thing_service_1.ThingService])
], ThingComponent);
exports.ThingComponent = ThingComponent;
