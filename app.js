/**
 * Created by udia on 2016-10-29.
 *
 * Copyright 2016 Udia Software Incorporated
 */
const http         = require('http'),
  fs           = require('fs'),
  path         = require('path'),
  contentTypes = require('./utils/content-types'),
  sysInfo      = require('./utils/sys-info'),
  env          = process.env;

let server = http.createServer(function (req, res) {
  let url = req.url;
  if (url == '/') {
    url += 'index.html';
  }

  if (url == '/health') {
    // respond to GET /health with status 200
    res.writeHead(200);
    res.end();
  } else if (url == '/info/gen' || url == '/info/poll') {
    // respond to GET /info with sysInfo
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.end(JSON.stringify(sysInfo[url.slice(6)]()));
  } else {
    // respond to everything else as static file read
    fs.readFile('./static' + url, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        let ext = path.extname(url).slice(1);
        res.setHeader('Content-Type', contentTypes[ext]);
        if (ext === 'html') {
          res.setHeader('Cache-Control', 'no-cache, no-store');
        }
        res.end(data);
      }
    });
  }
});

server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
  console.log(`Application worker ${process.pid} started...`);
});
