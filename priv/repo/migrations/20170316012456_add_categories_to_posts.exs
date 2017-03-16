defmodule Udia.Repo.Migrations.AddCategoriesToPosts do
  use Ecto.Migration

  def change do
    alter table(:logs_posts) do
      add :category_id, references(:logs_categories)
    end
  end
end
