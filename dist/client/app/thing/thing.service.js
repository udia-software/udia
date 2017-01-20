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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
/**
 * Created by alexander on 2016-12-08.
 */
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
require("rxjs/add/operator/map");
let ThingService = ThingService_1 = class ThingService {
    constructor(_http) {
        this._http = _http;
    }
    getAll() {
        return this._http
            .get(ThingService_1.ENDPOINT.replace(":id", ""))
            .map((r) => r.json());
    }
    add(message) {
        let _messageStringified = JSON.stringify({ message: message });
        let headers = new http_1.Headers();
        headers.append("Content-Type", "application/json");
        return this._http
            .post(ThingService_1.ENDPOINT.replace(":id", ""), _messageStringified, { headers })
            .map((r) => r.json());
    }
    remove(id) {
        return this._http
            .delete(ThingService_1.ENDPOINT.replace(":id", id));
    }
};
ThingService.ENDPOINT = "/api/things/:id";
ThingService = ThingService_1 = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(http_1.Http)),
    __metadata("design:paramtypes", [http_1.Http])
], ThingService);
exports.ThingService = ThingService;
var ThingService_1;
