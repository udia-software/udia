defmodule Udia.Records.Perception do
  @moduledoc """
  The schema for the Records Percpetion model
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Records.Perception

  schema "perceptions" do
    field :end_time, :utc_datetime
    field :start_time, :utc_datetime
    belongs_to :user, Udia.Accounts.User
    belongs_to :post, Udia.Logs.Post
  end

  @doc false
  def changeset(%Perception{} = perception, attrs) do
    perception
    |> cast(attrs, [:start_time, :end_time, :post_id, :user_id])
    |> validate_required([:start_time, :end_time, :post_id, :user_id])
  end
end
