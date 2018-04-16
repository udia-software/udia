# Udia

[![Travis](https://img.shields.io/travis/udia-software/udia.svg?style=flat-square)](https://travis-ci.org/udia-software/udia.svg?branch=master)
[![Coveralls github](https://img.shields.io/coveralls/github/udia-software/udia.svg?style=flat-square)](https://coveralls.io/github/udia-software/udia)
[![David](https://img.shields.io/david/udia-software/udia.svg?style=flat-square)](https://david-dm.org/udia-software/udia)
[![David](https://img.shields.io/david/dev/udia-software/udia.svg?style=flat-square)](https://david-dm.org/udia-software/udia?type=dev)

Prototype, do not use for anything.

## Quickstart

Clone Repo: `git clone https://pi.alexander-wong.com/gogs/udia-software/udia && cd udia`

**Docker**

    Docker mode is the staging environment.

1.  Start the application with `docker-compose up`

**Manual**

    Manual is reccommended for live reloading and development.

1.  Ensure you have a sql database accessible and ready. (`postgres` supported)
    * Helper Docker commands: `docker-compose -f postgres-compose.yml up` & `psql -h 0.0.0.0 -p 5432 -U pguser -d udiadb`
2.  Set your database connection values. (see [Environment Variables](#environment-variables))
3.  Install dependencies: `yarn install`
4.  Run database migrations `yarn runMigrations`
5.  Watch application: `yarn watch` or run application `yarn start`

## Environment Variables

| Environment Variable Name | Default Value                     | Description                                        |
| ------------------------- | --------------------------------- | -------------------------------------------------- |
| `NODE_ENV`                | `development`                     | Node Environment                                   |
| `PORT`                    | `3000`                            | Express port                                       |
| `TYPEORM_TYPE`            | `postgres`                        | Database (`postgres` officially supported)         |
| `TYPEORM_LOGGING`         | `true`                            | Log SQL queries to console                         |
| `SQL_USER`                | `pguser`                          | SQL User                                           |
| `SQL_PASSWORD`            | `mysecretpassword`                | SQL Password                                       |
| `SQL_HOST`                | `localhost`                       | SQL Hostname                                       |
| `SQL_PORT`                | `5432`                            | SQL Port Number for serving                        |
| `SQL_DB`                  | `udiadb`                          | SQL Database name (test: `udiadbtest`)             |
| `SQL_TEST_PORT`           | `5433`                            | SQL Port number for testing                        |
| `SQL_TEST_DB`             | `udiadbtest`                      | SQL Database name for testing                      |
| `JWT_SECRET`              | `DEVELOPMENT_SECRET`              | Secret string to use for JWT encryption            |
| `CORS_ORIGIN`             | `*`                               | Cross Origin Resource Sharing (space `` separated) |
| `CLIENT_DOMAINNAME`       | `localhost:3001`                  | Domain:port of client (`udia.ca`)                  |
| `CLIENT_PROTOCOL`         | `http`                            | Protocol of Client (`https`)                       |
| `EMAIL_TOKEN_TIMEOUT`     | `3600000`                         | How long should an email token last                |
| `SMTP_USERNAME`           | `xxlvhieo2gqp352o@ethereal.email` | SMTP Username (ethereal default)                   |
| `SMTP_PASSWORD`           | `rCJTErmv6v2uacmdRt`              | SMTP Password                                      |
| `SMTP_HOST`               | `smtp.ethereal.email`             | SMTP Host (ethereal default)                       |
| `SMTP_PORT`               | `587`                             | SMTP Port                                          |

## License

This is [free software](https://www.gnu.org/philosophy/free-sw.en.html), licensed under **GNU Affero General Public License v3 (AGPL-3.0)**.

```text
Copyright (C) 2018 Alexander Wong <alex@udia.ca>, Udia Software Incorporated

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
