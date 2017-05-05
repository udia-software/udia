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
    has_many :posts, Udia.Logs.Post

    timestamps()
  end
end
