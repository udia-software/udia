# Udia

[![Build Status](https://travis-ci.org/udia-software/udia.svg?branch=master)](https://travis-ci.org/udia-software/udia)
[![Coverage Status](https://coveralls.io/repos/github/udia-software/udia/badge.svg?branch=master)](https://coveralls.io/github/udia-software/udia?branch=master)
[![Deps Status](https://beta.hexfaktor.org/badge/all/github/udia-software/udia.svg)](https://beta.hexfaktor.org/github/udia-software/udia)
[![Deps Status](https://beta.hexfaktor.org/badge/prod/github/udia-software/udia.svg)](https://beta.hexfaktor.org/github/udia-software/udia)
[![Hex.pm](https://img.shields.io/hexpm/v/udia.svg)](https://hex.pm/packages/udia)
[![Docs](https://img.shields.io/badge/hexdocs-udia-green.svg)](https://hexdocs.pm/udia/api-reference.html)

[![UDIA](logo.png)](http://a.udia.ca)

**Universal Dream | Infinite Awareness**

Live site can be found at [https://a.udia.ca/](https://a.udia.ca).

Staging site can be found at [https://udia-staging.herokuapp.com](https://udia-staging.herokuapp.com)

## Quickstart (Development)

This project is using the [Phoenix Framework](http://www.phoenixframework.org/docs/installation) 1.3 Release Client ([upgrade instructions](https://gist.github.com/chrismccord/71ab10d433c98b714b75c886eff17357)).

### Setup (Docker)

Clone this repository and run `docker-compose up`, assuming you have Docker installed.

NOTE: Static assets building causes CPU usage to spike for OSX, perhaps comment that out and run brunch locally?

### Setup (without Docker on OSX)

Elixir & Hex:
* Update your homebrew to latest: `brew update`
* Install Elixir: `brew install elixir`
* Install Elixir's package manager Hex: `mix local.hex`

Phoenix:
* Install the latest Phoenix Mix Archive: `mix archive.install https://github.com/phoenixframework/archives/raw/master/phx_new.ez`

PostgreSQL:
* Download and run the Postgres.app [https://postgresapp.com](https://postgresapp.com/)

### Quickstart (Development)

To start the application:

  * Clone this repository and change directories into it `git clone https://github.com/udia-software/udia.git; cd udia`
  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Install Node.js dependencies with `cd assets && npm install`
  * Start Phoenix endpoint with `mix phx.server` or `iex -S mix phx.server`
  * (Optional) Seed your database with `mix run priv/repo/seeds.exs`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Testing

To test your phoenix app:

  * Set your mix environment variable to test `export MIX_ENV=test`
  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Run your tests with `mix test`
  * Generate a test coverage report with `mix coveralls`
  * Generate a code analysis report with `mix credo`

## Deployment

Ready to run in production? Please [check our deployment guides](http://www.phoenixframework.org/docs/deployment).

Udia is currently configured to run on Heroku using:

* [heroku-buildpack-elixir](https://github.com/HashNuke/heroku-buildpack-elixir.git)
* [heroku-buildpack-phoenix-static](https://github.com/gjaldon/heroku-buildpack-phoenix-static.git)

Within the Procfile, a heroku release will run `POOL_SIZE=2 mix ecto.migrate` every time a successfull deploy to `master` finishes. This will ensure seemless database migrations when deploying code to production.

## Development/Testing Configuration & Environment Variables

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
