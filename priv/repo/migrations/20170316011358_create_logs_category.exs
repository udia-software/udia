defmodule Udia.Repo.Migrations.CreateUdia.Logs.Category do
  use Ecto.Migration

  def change do
    create table(:logs_categories) do
      add :name, :string

      timestamps(type: :utc_datetime)
    end

  end
end
