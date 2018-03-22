# Udia

Prototype, do not use for anything.

## Quickstart

1.  Clone Repo: `git clone https://pi.alexander-wong.com/gogs/udia-software/udia && cd udia`

**Docker**

    Docker mode is the staging environment.
2.  Start the application with `docker-compose up`

**Manual**

    Manual is reccommended for live reloading and development.

2.  Ensure you have a sql database accessible and ready. (`postgres` supported, `cockroachdb` beta)
    - Helper Docker files: `docker-compose -f roach-compose.yml up` or `docker-compose -f postgres-compose.yml up`
3.  Set your database connection string or values. (see [Environment Variables](#environment-variables))
4.  Install npm dependencies: `npm install`
5.  Run application: `npm start` or watch application `npm run watch`

## Notes:

- Generate schema migrations with the following script:
`ts-node ./node_modules/.bin/typeorm migrations:generate -n`

## Environment Variables

| Environment Variable Name | Default Value | Description |
| ------------------------- | ------------- | ----------- |
| `NODE_ENV` | `development` | Node Environment |
| `PORT` | `3000` | Express port |
| `TYPEORM_TYPE` | `postgres` | Database (`postgres` officially supported) |
| `SQL_DB` | `udiadb` | SQL Database name |
| `SQL_HOST` | `db` | SQL Hostname |
| `SQL_USER` | `pguser` | SQL User |
| `SQL_PASSWORD` | `mysecretpassword` | SQL Password |
| `SQL_PORT` | `5432` | SQL Port Number |

## License

**GNU Affero General Public License v3 (AGPL-3.0)**

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
