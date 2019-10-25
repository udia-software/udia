# UDIA

[![Travis](https://shields.alexander-wong.com/travis/udia-software/udia.svg?style=flat-square)](https://travis-ci.org/udia-software/udia)
[![Codecov](https://shields.alexander-wong.com/codecov/c/github/udia-software/udia.svg?style=flat-square)](https://codecov.io/gh/udia-software/udia)
[![David](https://shields.alexander-wong.com/david/udia-software/udia.svg?style=flat-square)](https://david-dm.org/udia-software/udia)

**You are one with the universe.**

![UDIA](./static/logo/logo-256x256.png)

## Quickstart

Clone Repo: `git clone git@github.com:udia-software/udia.git && cd udia`

**Docker**

    Docker mode is the staging environment.

1.  Start the application with `docker-compose up`

**Manual**

    Manual is reccommended for live reloading and development.

1.  Ensure you have a sql database accessible and ready. (`postgres` supported)
    - You can use docker! `docker-compose -f dev-compose.yml up` and the defaults env variables all work.
    - To view raw database, connect to docker container with `psql -h 0.0.0.0 -p 5432 -U pguser -d udiadb`
2.  Set your database connection values. (see [Environment Variables](#environment-variables))
3.  Install dependencies: `yarn install`
4.  Run database migrations `yarn runMigrations`
5.  Watch application: `yarn watch` or run application `yarn start` or test application `yarn test`

    Without Docker Compose
```bash
docker pull postgres:11
mkdir -p $HOME/docker/volumes/postgres
docker run \
  --rm \
  --name pg-docker \
  --env POSTGRES_DB=udiadb \
  --env POSTGRES_USER=pguser \
  --env POSTGRES_PASSWORD=mysecretpassword \
  --publish 5432:5432 \
  --volume $HOME/docker/volumes/postgres:/var/lib/postgresql/data \
  --detach \
  postgres:11
```

## Environment Variables

These environment variables can be set by modifying your `~/.*rc` or `~/.*profile` files. Alternatively, modify the environment variables in the `docker-compose` files.

| Environment Variable Name | Default Value                     | Description                                        |
| ------------------------- | --------------------------------- | -------------------------------------------------- |
| `NODE_ENV`                | `development`                     | Node Environment                                   |
| `PORT`                    | `3000`                            | Express port                                       |
| `TYPEORM_TYPE`            | `postgres`                        | Database (`postgres` officially supported)         |
| `TYPEORM_LOGGING`         | `true`                            | Log SQL queries to console                         |
| `SQL_USER`                | `pguser`                          | SQL User                                           |
| `SQL_PASSWORD`            | `mysecretpassword`                | SQL Password                                       |
| `SQL_HOST`                | `127.0.0.1`                       | SQL Hostname                                       |
| `SQL_DB`                  | `udiadb`                          | SQL Database name (test: `udiadbtest`)             |
| `SQL_PORT`                | `5432`                            | SQL Port Number for serving                        |
| `SQL_TEST_DB`             | `udiadbtest`                      | SQL Database name for testing                      |
| `SQL_TEST_PORT`           | `5433`                            | SQL Port number for testing                        |
| `DATABASE_URL`            | `driver://user:pw@host:port/db`   | (Optional) Shorthand for SQL_* non test fields     |
| `JWT_SECRET`              | `DEVELOPMENT_SECRET`              | Secret string to use for JWT encryption            |
| `JWT_ALGORITHM`           | `HS256`                           | Signing algorithm to use for JWT                   |
| `JWT_EXPIRES_IN`          | `7d`                              | How long the JWT should be valid for               |
| `CORS_ORIGIN`             | `http://127.0.0.1:3001`           | OPTIONS Res Header for Access-Control-Allow-Origin |
| `CLIENT_DOMAINNAME`       | `127.0.0.1:3001`                  | Domain:port of client (`udia.ca`)                  |
| `CLIENT_PROTOCOL`         | `http`                            | Protocol of Client (`https`)                       |
| `EMAIL_TOKEN_TIMEOUT`     | `3600000`                         | How long should an email token last in ms          |
| `FROM_EMAIL`              | `noreply@udia.ca`                 | Email to use for `from` field                      |
| `REPLY_TO_EMAIL_NAME`     | `Alexander Wong`                  | Name to use for `reply-to` field                   |
| `REPLY_TO_EMAIL_ADDR`     | `alex@udia.ca`                    | Email to use for `reply-to` field                  |
| `SMTP_USERNAME`           | `xxlvhieo2gqp352o@ethereal.email` | SMTP Username (ethereal default)                   |
| `SMTP_PASSWORD`           | `rCJTErmv6v2uacmdRt`              | SMTP Password                                      |
| `SMTP_HOST`               | `smtp.ethereal.email`             | SMTP Host (ethereal default)                       |
| `SMTP_PORT`               | `587`                             | SMTP Port                                          |
| `HEALTH_METRIC_INTERVAL`  | `500`                             | How often to send health metric                    |
| `DEV_JWT`                 |                                   | (optional) Set Dev `/graphiql` passHeader jwt      |
| `AWS_ACCESS_KEY_ID`       |                                   | (optional) Use AWS SDK for email instead of SMTP   |
| `AWS_SECRET_ACCESS_KEY`   |                                   | (optional) If two fields are set, will ignore SMTP |
| `AWS_SES_REGION`          | `us-west-2`                       | The region for Amazon's SES service                |
| `ITEMS_PAGE_LIMIT`        | `32`                              | Items page size maximum value                      |
| `USERS_PAGE_LIMIT`        | `32`                              | Users page size maximum value                      |

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
