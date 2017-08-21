defmodule Udia.Repo.Migrations.AddStartEndToJourneys do
  use Ecto.Migration

  def change do
    alter table(:logs_journeys) do
      add :start_date, :utc_datetime, default: fragment("now()")
      add :end_date, :utc_datetime
    end
  end
end
