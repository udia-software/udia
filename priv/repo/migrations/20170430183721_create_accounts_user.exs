defmodule Udia.Repo.Migrations.CreateUdia.Accounts.User do
  use Ecto.Migration

  def change do
    create table(:accounts_users, primary_key: false) do
      add :id, :uuid, primary_key: true
      add :username, :string, null: false
      add :password_hash, :string, null: false

      timestamps([type: :utc_datetime])
    end

    create unique_index(:accounts_users, [:username])

  end
end
