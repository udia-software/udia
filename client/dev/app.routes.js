"use strict";
var router_1 = require('@angular/router');
var home_component_1 = require('./home/components/home.component');
var appRoutes = [
    { path: '', component: home_component_1.HomeComponent },
    { path: '**', redirectTo: '' }
];
exports.appRoutingProviders = [];
exports.routing = router_1.RouterModule.forRoot(appRoutes);
