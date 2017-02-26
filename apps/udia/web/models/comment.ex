defmodule Udia.Comment do
  use Udia.Web, :model

  schema "comments" do
    field :body, :string
    belongs_to :user, Udia.User
    belongs_to :node, Udia.Node
    belongs_to :parent_comment, Udia.Comment
    has_many :child_comments, Udia.Comment

    timestamps()
  end

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:body, :user, :node, :parent_comment])
    |> validate_required([:body, :user, :node])
  end
end
