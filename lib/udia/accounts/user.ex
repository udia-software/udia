defmodule Udia.Accounts.User do
  @moduledoc """
  The schema for the Accounts User model.
  """
  use Ecto.Schema

  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "accounts_users" do
    field :username, :string
    field :password_hash, :string
    field :password, :string, virtual: true

    has_many :journeys, Udia.Logs.Journey, foreign_key: :explorer_id
    has_many :posts, Udia.Logs.Post, foreign_key: :author_id
    has_many :comments, Udia.Logs.Comment, foreign_key: :author_id

    timestamps()
  end
end
