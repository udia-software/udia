"use strict";
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var compression = require('compression');
var zlib = require('zlib');
var RoutesConfig = (function () {
    function RoutesConfig() {
    }
    RoutesConfig.init = function (application) {
        var _root = process.cwd();
        var _nodeModules = '/node_modules/';
        var _clientFiles = (process.env.NODE_ENV === 'production') ? '/client/dist/' : '/client/dev/';
        application.use(compression({
            level: zlib.Z_BEST_COMPRESSION,
            threshold: '1kb'
        }));
        application.use(express.static(_root + _nodeModules));
        application.use(express.static(_root + _clientFiles));
        application.use(bodyParser.json());
        application.use(morgan('dev'));
        application.use(helmet());
    };
    return RoutesConfig;
}());
exports.RoutesConfig = RoutesConfig;
