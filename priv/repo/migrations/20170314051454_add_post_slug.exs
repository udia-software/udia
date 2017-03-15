defmodule Udia.Repo.Migrations.AddPostSlug do
  use Ecto.Migration

  def change do
    alter table(:logs_posts) do
      add :slug, :string
    end
  end
end
