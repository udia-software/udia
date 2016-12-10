# Udia

Software is tragically beautiful because the struggle can be easily documented. 

[![Build Status](https://travis-ci.org/udia-software/udia.svg?branch=master)](https://travis-ci.org/udia-software/udia)
[![Coverage Status](https://coveralls.io/repos/github/udia-software/udia/badge.svg?branch=master)](https://coveralls.io/github/udia-software/udia?branch=master)
[![npm version](https://badge.fury.io/js/udia.svg)](https://badge.fury.io/js/udia)
[![GitHub version](https://badge.fury.io/gh/udia-software%2Fudia.svg)](https://badge.fury.io/gh/udia-software%2Fudia)
[![Join the chat at https://gitter.im/udiApp/Lobby](https://badges.gitter.im/udiApp/Lobby.svg)](https://gitter.im/udiApp/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Dependency Status](https://img.shields.io/david/udia-software/udia.svg)](https://david-dm.org/udia-software/udia)
[![Dev-Dependency Status](https://img.shields.io/david/dev/udia-software/udia.svg)](https://david-dm.org/udia-software/udia#info=devDependencies)

## Environment Variables

All of the default values are set programmatically if the environment variable does not exist.

To change the value without setting it in code, please set the environment variable.


| Key           | Default Value                      |Description|
| ------------- |:----------------------------------:|---:|
| MONGODB_URL   | `"mongodb://localhost:27017/udia"` | The Mongo Connection String. ([See spec.](https://docs.mongodb.com/manual/reference/connection-string/)) |
| APP_SECRET    | `"SECRET_GOES_HERE"`               | [Cookie Parser secret](https://github.com/expressjs/cookie-parser#cookieparsersecret-options) used for signing cookies. |
| HTTP_PORT     | `8080`                             | Port to serve http. [http://localhost:8080](http://localhost:8080) |
| HTTPS_PORT    | `8443`                             | Port to serve https. [https://localhost:8443](https://localhost:8443) |

## License

```text
The MIT License (MIT)
Copyright (c) 2016 Udia Software Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```