defmodule Udia.Repo.Migrations.IncreateStringLength do
  use Ecto.Migration

  def change do
    alter table(:logs_comments) do
      modify :content, :string, size: 20000
    end
    alter table(:logs_posts) do
      modify :content, :string, size: 20000
    end
    alter table(:logs_journeys) do
      modify :description, :string, size: 20000
    end
  end
end
