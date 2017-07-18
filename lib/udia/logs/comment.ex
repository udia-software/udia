defmodule Udia.Logs.Comment do
  @moduledoc """
  The schema for the Logs Comment model.

  Example: %Udia.Logs.Comment{
    __meta__: #Ecto.Schema.Metadata<:loaded, "logs_comments">,
    author: #Ecto.Association.NotLoaded<association :author is not loaded>,
    author_id: 388,
    children: #Ecto.Association.NotLoaded<association :children is not loaded>,
    content: "some content",
    id: 1,
    inserted_at: %DateTime{
      calendar: Calendar.ISO,
      day: 18,
      hour: 21,
      microsecond: {382226, 6},
      minute: 13,
      month: 7,
      second: 25,
      std_offset: 0,
      time_zone: "Etc/UTC",
      utc_offset: 0,
      year: 2017,
      zone_abbr: "UTC"},
    parent: #Ecto.Association.NotLoaded<association :parent is not loaded>,
    parent_id: nil,
    post: #Ecto.Association.NotLoaded<association :post is not loaded>,
    post_id: nil,
    type: "text",
    updated_at: %DateTime{
      calendar: Calendar.ISO,
      day: 18,
      hour: 21,
      microsecond: {382232, 6},
      minute: 13,
      month: 7,
      second: 25,
      std_offset: 0,
      time_zone: "Etc/UTC",
      utc_offset: 0,
      year: 2017,
      zone_abbr: "UTC"}}
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
    |> cast(attrs, [:content, :type, :post_id])
    |> validate_required([:content, :type, :post_id])
  end
end
