use Mix.Config

config :udia, :environment, :prod

config :udia, UdiaWeb.Endpoint,
  http: [port: {:system, "PORT"}],
  url: [host: System.get_env("DOMAIN_NAME") || "udia.herokuapp.com", port: 443],
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  secret_key_base: System.get_env("SECRET_KEY_BASE")

config :logger, level: :info

config :udia, Udia.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  ssl: true

config :udia, :udia_client,
  client_origin_url: System.get_env("CLIENT_ORIGIN_URL") || "https://www.udia.ca"

config :guardian, Guardian,
  secret_key: System.get_env("GUARDIAN_SECRET_KEY")
