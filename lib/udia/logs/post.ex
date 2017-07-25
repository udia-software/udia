defmodule Udia.Logs.Post do
  @moduledoc """
  The schema for the Logs Post model.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Logs.Post

  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "logs_posts" do
    field :title, :string
    field :content, :string
    field :type, :string
    belongs_to :author, Udia.Accounts.User
    belongs_to :journey, Udia.Logs.Journey
    has_many :comments, Udia.Logs.Comment

    timestamps()
  end

  @doc false
  def changeset(%Post{} = post, attrs) do
    post = post
    |> cast(attrs, [:title, :type, :content, :journey_id])
    |> validate_required([:title, :type, :content])
  end
end
