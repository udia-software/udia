defmodule Udia.Repo.Migrations.IncreaseCommentContentLength do
  use Ecto.Migration

  def change do
    alter table(:logs_comments) do
      modify :content, :string, size: 65535
    end
  end
end
