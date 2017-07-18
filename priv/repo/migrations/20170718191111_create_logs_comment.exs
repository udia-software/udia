defmodule Udia.Repo.Migrations.CreateUdia.Logs.Comment do
  use Ecto.Migration

  def change do
    create table(:logs_comments) do
      add :content, :string
      add :author, :string

      timestamps()
    end

  end
end
