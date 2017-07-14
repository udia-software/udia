defmodule Udia.Repo.Migrations.IncreasePostContentLength do
  use Ecto.Migration

  def change do
    alter table(:logs_posts) do
      modify :content, :string, size: 65535
    end
  end
end
