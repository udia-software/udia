defmodule Udia.Mixfile do
  use Mix.Project

  def project do
    [app: :udia,
     version: "0.0.1",
     elixir: "~> 1.4",
     elixirc_paths: elixirc_paths(Mix.env),
     compilers: [:phoenix, :gettext] ++ Mix.compilers,
     start_permanent: Mix.env == :prod,
     aliases: aliases(),
     deps: deps(),
     description: description(),
     package: package(),
     test_coverage: [tool: ExCoveralls]]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [mod: {Udia.Application, []},
     extra_applications: [:logger, :runtime_tools, :cowboy, :comeonin,
                          :scrivener_ecto]]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_),     do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [{:phoenix, "~> 1.3.0-rc.2", override: true},
     {:phoenix_pubsub, "~> 1.0.2"},
     {:phoenix_ecto, "~> 3.2.3"},
     {:postgrex, "~> 0.13.3"},
     {:phoenix_html, "~> 2.9.3"},
     {:phoenix_live_reload, "~> 1.0.8", only: :dev},
     {:gettext, "~> 0.13.1"},
     {:cowboy, "~> 1.1.2"},
     {:comeonin, "~> 3.0.2"},
     {:cors_plug, "~> 1.2"},
     {:guardian, "~> 0.14.4"},
     {:guardian_db, "~> 0.8.0"},
     {:scrivener_ecto, "~> 1.2.2"},
     {:paper_trail, "~> 0.7.5"},
     {:excoveralls, "~> 0.7.0", only: :test},
     {:credo, "~> 0.8.1", only: [:dev, :test]}]
  end

  defp description do
    """
    A web application in pursuit of meaning in life.
    """
  end

  defp package do
    [name: :udia,
     files: ["config", "lib", "priv", "test", ".gitignore", ".travis.yml",
             "docker-compose.yml", "elixir_buildpack.config",
             "Procfile", "Dockerfile", "LICENSE*", "README*", "mix.exs"],
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    ["ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
     "ecto.reset": ["ecto.drop", "ecto.setup"],
     "test": ["ecto.create --quiet", "ecto.migrate", "test"],
     "sanity": ["coveralls", "credo"]]
  end
end
