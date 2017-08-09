defmodule Udia.Repo.Migrations.CreatePerceptions do
  use Ecto.Migration

  def change do
    create table(:perceptions) do
      add :start_time, :utc_datetime
      add :end_time, :utc_datetime
      add :user_id, references(:accounts_users, on_delete: :nothing)
      add :post_id, references(:logs_posts, on_delete: :nothing)
    end

    create index(:perceptions, [:user_id])
    create index(:perceptions, [:post_id])
  end
end
