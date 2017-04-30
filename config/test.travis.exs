use Mix.Config

config :udia, Udia.Web.Endpoint,
  http: [port: 4001],
  server: false

config :logger, level: :warn

config :udia, Udia.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "",
  database: "travis_ci_test",
  hostname: "localhost",
  port: 5432,
  pool: Ecto.Adapters.SQL.Sandbox

config :guardian, Guardian,
  secret_key: "8AkIfrSA1oWLv0n1aX0RnQhn6ID9LnspyqCvaMawQklazG8fgczu94LjVKQtFeAW"
