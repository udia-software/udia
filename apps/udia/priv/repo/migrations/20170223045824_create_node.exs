defmodule Udia.Repo.Migrations.CreateNode do
  use Ecto.Migration

  def change do
    create table(:nodes) do
      add :title, :string
      add :content, :string
      add :user_id, references(:users, on_delete: :nothing)

      timestamps()
    end
    create index(:nodes, [:user_id])

  end
end
