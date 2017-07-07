defmodule Udia.Repo.Migrations.CreateUdia.Accounts.User do
  use Ecto.Migration

  def change do
    create table(:accounts_users) do
      add :username, :string, null: false
      add :password_hash, :string, null: false

      timestamps([type: :utc_datetime])
    end

    create unique_index(:accounts_users, [:username])

  end
end
