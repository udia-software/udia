defmodule Udia.Logs.Journey do
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Logs.Journey


  schema "logs_journeys" do
    field :description, :string
    field :title, :string
    belongs_to :explorer, Udia.Accounts.User
    has_many :posts, Udia.Logs.Post

    timestamps()
  end

  @doc false
  def changeset(%Journey{} = journey, attrs) do
    journey
    |> cast(attrs, [:title, :description])
    |> validate_required([:title, :description])
  end
end
