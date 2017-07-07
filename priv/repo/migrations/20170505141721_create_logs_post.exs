defmodule Udia.Repo.Migrations.CreateUdia.Logs.Post do
  use Ecto.Migration

  def change do
    create table(:logs_posts) do
      add :title, :string
      add :type, :string
      add :content, :string
      add :author_id, references(:accounts_users, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end
    create index(:logs_posts, [:author_id])
    create index(:logs_posts, [:title])
  end
end
