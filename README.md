# Udia

Built under the conviction that software and philosophy can be unified.

[![Build Status](https://travis-ci.org/udia-software/udia.svg?branch=master)](https://travis-ci.org/udia-software/udia)
[![Coverage Status](https://coveralls.io/repos/github/udia-software/udia/badge.svg?branch=master)](https://coveralls.io/github/udia-software/udia?branch=master)
[![npm version](https://badge.fury.io/js/udia.svg)](https://badge.fury.io/js/udia)
[![GitHub version](https://badge.fury.io/gh/udia-software%2Fudia.svg)](https://badge.fury.io/gh/udia-software%2Fudia)
[![Join the chat at https://gitter.im/udia-software/Lobby](https://badges.gitter.im/udia-software/Lobby.svg)](https://gitter.im/udia-software/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Dependency Status](https://img.shields.io/david/udia-software/udia.svg)](https://david-dm.org/udia-software/udia)

## About

Uses a MAGNET stack. (MEAN*)
* MongoDB - A free, open-source, cross-platform, document-oriented database program for all your NoSQL needs.
  * [Download](https://www.mongodb.com/download-center#community) and [Documentation](https://docs.mongodb.com/)
  * To run this application in your development environment, a `mongod` instance needs to be running.
* Angular - A Superheroic JavaScript MVW Framework created by Google.
  * [Documentation](https://angular.io/docs/ts/latest/)
* Gulp - A JavaScript streaming automation toolkit.
  * [Documentation](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
* NodeJS - Server side JavaScript runtime environment based on V8.
  * [Download](https://nodejs.org/en/download/)
* Express - Fast, unopinionated, minimalist web framework for Node.js
  * [Documentation](http://expressjs.com/en/4x/api.html)
* TypeScript - A typed superset of JavaScript that compiles to plain JavaScript.
  * [Documentation](https://www.typescriptlang.org/docs/tutorial.html)

## Prerequisites

Ensure you have NodeJS, NPM, and Mongo installed.
```bash
# Your setup may look different than mine.
$ node -v
v6.9.1
$ npm -v
3.10.8
$ mongo --version
MongoDB shell version: 3.2.11
```

## Getting Started

Clone this repository locally.
```bash
git clone https://github.com/udia-software/udia
cd udia
```

Install all dependencies.
```bash
npm install
```

Run the default gulp task to build your application.
```bash
# if you have gulp-cli installed globally
# npm install -g gulp-cli
gulp
# otherwise
npm run gulp
```

Start your application. (Ensuring an instance of `mongod` is running)
```bash
npm start
# Or, if you want auto-reload with nodemon
gulp start
```

## Development

Here are the following gulp tasks:

| Command | Description |
|--------:|:----------- |
| `gulp`  | Copy over all client html/css, npm dependencies, build all of the TypeScript files |
| `gulp clean` | Remove the `dist` directory and all *.js and *.map files in `src` |
| `gulp tslint` | Outputs a TSLint report for all the source code. |
| `gulp start` | Runs nodemon while watching all the typescript, css, html files. |

## Testing

In order to test, simply run `npm test`.

## Environment Variables

All of the default values are set programmatically if the environment variable does not exist.

To change the value without setting it in code, please set the environment variable.


| Key            | Default Value                      |Description|
| -------------- |:----------------------------------:|----------:|
| NODE_ENV       | `undefined`                        | The node environment. `undefined` will be equivalent to `"development"`. Can also be `"test"` or `"production"`. |
| MONGODB_URI    | `"mongodb://localhost:27017/udia"` | The Mongo Connection String. ([See spec.](https://docs.mongodb.com/manual/reference/connection-string/)) |
| APP_SECRET     | `"SECRET_GOES_HERE"`               | [Cookie Parser secret](https://github.com/expressjs/cookie-parser#cookieparsersecret-options) used for signing cookies. |
| SESSION_SECRET | `"SECRET_GOES_HERE"`               | JsonWebToken secret used to sign all the tokens. |
| HTTP_PORT      | `8080`                             | Port to serve http. [http://localhost:8080](http://localhost:8080) |
| HTTPS_PORT     | `8443`                             | Port to serve https. [https://localhost:8443](https://localhost:8443) |

## License

[MIT License](LICENSE)

---
[![Udia](/logo.svg)](https://a.udia.ca/)

###By [Udia](https://udia.ca)
