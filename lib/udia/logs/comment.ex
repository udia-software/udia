defmodule Udia.Logs.Comment do
  @moduledoc """
  The schema for the Logs Comment model.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias Udia.Logs.Comment

  @timestamps_opts [type: :utc_datetime, usec: true]
  schema "logs_comments" do
    field :type, :string
    field :content, :string
    belongs_to :author, Udia.Accounts.User
    belongs_to :post, Udia.Logs.Post
    has_many :children, Comment
    belongs_to :parent, Comment

    timestamps()
  end

  @doc """
    Recursively load parents into the given struct until it hits nil
  """
  def load_parents(parent) do
    load_parents(parent, 10)
  end

  def load_parents(_, limit) when limit < 0, do: raise "Recursion limit reached"

  def load_parents(%Comment{parent: %Ecto.Association.NotLoaded{}} = parent, limit) do
    parent = parent |> Udia.Repo.preload(:parent)
    Map.update!(parent, :parent, &Comment.load_parents(&1, limit - 1))
  end

  def load_parents(nil, _), do: nil

  @doc """
    Recursively loads children into the given struct until it hits []
  """
  def load_children(model), do: load_children(model, 10)

  def load_children(_, limit) when limit < 0, do: raise "Recurison limit reached"

  def load_children(%Comment{children: %Ecto.Association.NotLoaded{}} = model, limit) do
    model = model |> Udia.Repo.preload(:children)
    Map.update!(model, :children, fn(list) ->
      Enum.map(list, &Comment.load_children(&1, limit - 1))
    end)
  end

  @doc false
  def changeset(%Comment{} = comment, attrs) do
    comment
    |> cast(attrs, [:content, :type])
    |> validate_required([:content, :type])
  end
end
