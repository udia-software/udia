use Mix.Config

config :udia, :environment, :test

config :udia, UdiaWeb.Endpoint,
  http: [port: 4001],
  server: false

config :logger, level: :warn

config :udia, Udia.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USERNAME") || "postgres",
  password: System.get_env("POSTGRES_PASSWORD") || "postgres",
  database: System.get_env("POSTGRES_TEST_DB") || "udia_test",
  hostname: System.get_env("POSTGRES_HOSTNAME") || "localhost",
  port: System.get_env("POSTGRES_PORT") || "5432",
  pool: Ecto.Adapters.SQL.Sandbox

config :guardian, Guardian,
  secret_key: "8AkIfrSA1oWLv0n1aX0RnQhn6ID9LnspyqCvaMawQklazG8fgczu94LjVKQtFeAW"

# reduce security on test environment
config :bcrypt_elixir, :log_rounds, 4

config :udia, Udia.Mailer,
  adapter: Bamboo.TestAdapter
