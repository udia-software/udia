defmodule Udia.Logs.Journey do
  @moduledoc """
  The schema for the Logs Journey model.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Logs.Journey

  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "logs_journeys" do
    field :description, :string
    field :title, :string
    belongs_to :explorer, Udia.Accounts.User
    has_many :posts, Udia.Logs.Post
    field :start_time, :utc_datetime
    field :end_time, :utc_datetime

    timestamps()
  end

  @doc false
  def changeset(%Journey{} = journey, attrs) do
    journey
    |> cast(attrs, [:title, :description, :start_time, :end_time])
    |> validate_required([:title, :description, :start_time])
  end
end
