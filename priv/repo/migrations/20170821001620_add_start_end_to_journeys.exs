defmodule Udia.Repo.Migrations.AddStartEndToJourneys do
  use Ecto.Migration

  def change do
    alter table(:logs_journeys) do
      add :start_time, :utc_datetime, default: fragment("now()")
      add :end_time, :utc_datetime
    end
  end
end
