# Udia

[![Build Status](https://travis-ci.org/udia-software/udia.svg?branch=master)](https://travis-ci.org/udia-software/udia)
[![Coverage Status](https://coveralls.io/repos/github/udia-software/udia/badge.svg?branch=master)](https://coveralls.io/github/udia-software/udia?branch=master)
[![Slack](https://img.shields.io/badge/slack-udia-green.svg)](https://udia.slack.com/messages/general/)

[![UDIA](logo.png)](http://a.udia.ca)

**Universal Dream | Infinite Awareness**

Live site can be found at [http://a.udia.ca/](http://a.udia.ca)

## Requirements

Please follow all installation instructions found at [phoenixframework.org/docs/installation](http://www.phoenixframework.org/docs/installation).

## Quickstart (Development)

To start your Phoenix app:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Inside the `apps/udia` directory, install Node.js dependencies with `npm install`
  * Start Phoenix endpoint with `mix phoenix.server` or `iex -S mix phoenix.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Testing

To test your phoenix app:

  * Set your mix environment variable to test `export MIX_ENV=test`
  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Run your tests with `mix test`
  * Generate a test coverage report with `mix coveralls`

## Deployment

Ready to run in production? Please [check our deployment guides](http://www.phoenixframework.org/docs/deployment).

Udia is currently configured to run on Heroku using:

* [heroku-buidpack-elixir](https://github.com/HashNuke/heroku-buildpack-elixir.git)
* [heroku-buildpack-phoenix-static](https://github.com/gjaldon/heroku-buildpack-phoenix-static.git)

Within the Procfile, a heroku release will run `POOL_SIZE=2 mix ecto.migrate` every time a successfull deploy to `master` finishes. This will ensure seemless database migrations when deploying code to production.

## Configuration & Environment Variables

Application will work with default settings if using something like [PostgresApp](https://postgresapp.com/), however if you need to change the credentials the following enviornment variables are available.

| Environment Variable | Default Value | Description            |
| -------------------- |:-------------:| ----------------------:|
| `POSTGRES_USERNAME`  | `"postgres"`  | PostgreSQL DB Username |
| `POSTGRES_PASSWORD`  | `"postgres"`  | PostgreSQL DB Password |
| `POSTGRES_DEV_DB`    | `"udia_dev"`  | Development DB Name    |
| `POSTGRES_TEST_DB`   | `"udia_test"` | Test DB Name           |
| `POSTGRES_HOSTNAME`  | `"localhost"` | Hostname for DB        |

## License

Udia Software Incorporated (UDIA)

Copyright (c) 2016-2017 Udia Software Incorporated. All Rights Reserved.

Common Public Attribution License Version 1.0 (CPAL)

Full license text can be found at [LICENSE](LICENSE)
