defmodule Udia.Accounts.User do
  @moduledoc """
  The schema for the Accounts User model.
  """
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "accounts_users" do
    field :username, :string
    field :password_hash, :string
    field :password, :string, virtual: true

    timestamps()
  end
end
