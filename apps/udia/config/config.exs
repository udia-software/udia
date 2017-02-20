# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :udia,
  ecto_repos: [Udia.Repo]

# Configures the endpoint
config :udia, Udia.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "1qLidXrdNu8q/Zhvr0+HzpGFw0UK3lzbzIb70z0HENlHg5/i+k8CQMuDUodGnUb+",
  render_errors: [view: Udia.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Udia.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
