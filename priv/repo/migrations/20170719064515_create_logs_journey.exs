defmodule Udia.Repo.Migrations.CreateUdia.Logs.Journey do
  use Ecto.Migration

  def change do
    create table(:logs_journeys) do
      add :title, :string
      add :description, :string
      add :explorer_id, references(:accounts_users, on_delete: :nilify_all)

      timestamps()
    end

    alter table(:logs_posts) do
      add :journey_id, references(:logs_journeys, on_delete: :nilify_all)
    end

    create index(:logs_journeys, [:explorer_id])
  end
end
