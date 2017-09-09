defmodule Udia.Mixfile do
  use Mix.Project

  def project do
    [
      app: :udia,
      version: "0.1.3",
      elixir: "~> 1.4",
      elixirc_paths: elixirc_paths(Mix.env),
      compilers: [:phoenix, :gettext] ++ Mix.compilers,
      start_permanent: Mix.env == :prod,
      aliases: aliases(),
      deps: deps(),
      description: description(),
      package: package(),
      test_coverage: [tool: ExCoveralls],
      source_url: "https://github.com/udia-software/udia",
      homepage_url: "https://www.udia.ca"
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Udia.Application, []},
      extra_applications: [:logger, :runtime_tools, :cowboy, :comeonin,
                           :scrivener_ecto, :bamboo],
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_),     do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:bcrypt_elixir, "~> 0.12.1"},
      {:phoenix, "~> 1.3.0"},
      {:phoenix_pubsub, "~> 1.0.2"},
      {:phoenix_ecto, "~> 3.2.3"},
      {:postgrex, "~> 0.13.3"},
      {:phoenix_html, "~> 2.10.3"},
      {:phoenix_live_reload, "~> 1.0.8", only: :dev},
      {:gettext, "~> 0.13.1"},
      {:cowboy, "~> 1.1.2"},
      {:comeonin, "~> 4.0.0"},
      {:cors_plug, "~> 1.4.0"},
      {:guardian, "~> 0.14.5"},
      {:guardian_db, "~> 0.8.0"},
      {:scrivener_ecto, "~> 1.2.2"},
      {:paper_trail, "~> 0.7.5"},
      {:bamboo, github: "thoughtbot/bamboo"},
      {:excoveralls, "~> 0.7.2", only: :test},
      {:credo, "~> 0.8.5", only: [:dev, :test]},
      {:ex_doc, "~> 0.16.2", only: :dev},
    ]
  end

  defp description do
    """
    A web application in pursuit of meaning in life.
    """
  end

  defp package do
    [
      name: :udia,
      files: ["config", "lib", "priv", "test", ".gitignore", ".travis.yml",
              "docker-compose.yml", "elixir_buildpack.config", "Procfile",
              "Dockerfile", "LICENSE*", "README*", "mix.exs", "logo*"],
      licenses: ["Common Public Attribution License Version 1.0"],
      maintainers: ["Alexander Wong <admin@udia.ca>"],
      links: %{"GitHub" => "https://github.com/udia-software/udia"}
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
