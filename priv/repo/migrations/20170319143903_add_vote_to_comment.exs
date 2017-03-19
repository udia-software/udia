defmodule Udia.Repo.Migrations.AddVoteToComment do
  use Ecto.Migration

  def change do
    alter table(:reactions_votes) do
      add :comment_id, references(:logs_comments, on_delete: :delete_all)
    end

  end
end
