defmodule Udia.Logs.Post do
  @moduledoc """
  The schema for the Logs Post model.
  """
  use Ecto.Schema

  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "logs_posts" do
    field :title, :string
    field :content, :string
    field :type, :string
    belongs_to :author, Udia.Accounts.User

    timestamps()
  end
end
