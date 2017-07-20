defmodule Udia.Repo.Migrations.CreateUdia.Logs.Comment do
  use Ecto.Migration

  def change do
    create table(:logs_comments) do
      add :type, :string
      add :content, :string

      add :author_id, references(:accounts_users, on_delete: :nilify_all)
      add :post_id, references(:logs_posts, on_delete: :nilify_all)
      add :parent_id, references(:logs_comments)

      timestamps(type: :utc_datetime)
    end
    create index(:logs_comments, [:author_id])
    create index(:logs_comments, [:post_id])
  end
end
