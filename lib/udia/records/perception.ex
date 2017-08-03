defmodule Udia.Records.Perception do
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Records.Perception


  schema "perceptions" do
    field :end_time, :utc_datetime
    field :start_time, :utc_datetime
    field :user_id, :id
    field :post_id, :id

    timestamps()
  end

  @doc false
  def changeset(%Perception{} = perception, attrs) do
    perception
    |> cast(attrs, [:start_time, :end_time])
    |> validate_required([:start_time, :end_time])
  end
end
