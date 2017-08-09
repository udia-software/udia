defmodule Udia.Application do
  @moduledoc """
  Boundary for the web application Udia.
  """
  use Application
  require Logger

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec

    # Define workers and child supervisors to be supervised
    children = [
      # Start the Ecto repository
      supervisor(Udia.Repo, []),
      # Start the endpoint when the application starts
      supervisor(UdiaWeb.Endpoint, []),
      # Start the presence supervisor
      supervisor(UdiaWeb.Presence, []),
      # Start your own worker by calling: Udia.Worker.start_link(arg1, arg2, arg3)
      # worker(Udia.Worker, [arg1, arg2, arg3]),
      worker(GuardianDb.ExpiredSweeper, []),
      worker(ChannelWatcher, [:post])
    ]

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Udia.Supervisor]
    start_links = Supervisor.start_link(children, opts)

    # Last ditch enforce all presences to be good.
    # This command is only run once on startup
    # therefore it will clean up all hanging presences on startup
    import Ecto.Query
    cleanup_val = Udia.Repo.update_all(
      from(p in Udia.Records.Perception, where: p.counter > 0),
      set: [
        counter: 0,
        end_time: DateTime.from_unix!(System.system_time(:seconds))
      ]
    )
    Logger.info "Presence Cleanup: #{inspect cleanup_val}"
    start_links
  end
end
