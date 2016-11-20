"use strict";
var fs = require('fs');
var StaticDispatcher = (function () {
    function StaticDispatcher() {
    }
    StaticDispatcher.sendIndex = function (req, res) {
        var _root = process.cwd();
        res.type('.html');
        fs.createReadStream(_root + '/client/dev/index.html')
            .pipe(res);
    };
    return StaticDispatcher;
}());
exports.StaticDispatcher = StaticDispatcher;
