defmodule Udia.Records do
  @moduledoc """
  The Records context.
  """

  import Ecto.Query, warn: false
  alias Udia.Repo

  alias Udia.Accounts.User
  alias Udia.Records.Perception

  @doc """
  Returns the list of perceptions.
  """
  def list_perceptions do
    Repo.all(Perception)
  end

  @doc """
  Gets a single perception.

  Raises `Ecto.NoResultsError` if the Perception does not exist.
  """
  def get_perception!(id), do: Repo.get!(Perception, id)

  @doc """
  Creates a perception.
  """
  def create_perception(%User{} = user, attrs \\ %{}) do
    user
    |> Ecto.build_assoc(:perceptions)
    |> Perception.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a perception.
  """
  def update_perception(%Perception{} = perception, attrs) do
    perception
    |> Perception.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Perception.
  """
  def delete_perception(%Perception{} = perception) do
    Repo.delete(perception)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking perception changes.
  """
  def change_perception(%Perception{} = perception) do
    Perception.changeset(perception, %{})
  end
end
