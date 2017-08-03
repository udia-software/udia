defmodule Udia.Records do
  @moduledoc """
  The Records context.
  """

  import Ecto.Query, warn: false
  alias Udia.Repo

  alias Udia.Records.Perception

  @doc """
  Returns the list of perceptions.

  ## Examples

      iex> list_perceptions()
      [%Perception{}, ...]

  """
  def list_perceptions do
    Repo.all(Perception)
  end

  @doc """
  Gets a single perception.

  Raises `Ecto.NoResultsError` if the Perception does not exist.

  ## Examples

      iex> get_perception!(123)
      %Perception{}

      iex> get_perception!(456)
      ** (Ecto.NoResultsError)

  """
  def get_perception!(id), do: Repo.get!(Perception, id)

  @doc """
  Creates a perception.

  ## Examples

      iex> create_perception(%{field: value})
      {:ok, %Perception{}}

      iex> create_perception(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_perception(attrs \\ %{}) do
    %Perception{}
    |> Perception.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a perception.

  ## Examples

      iex> update_perception(perception, %{field: new_value})
      {:ok, %Perception{}}

      iex> update_perception(perception, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_perception(%Perception{} = perception, attrs) do
    perception
    |> Perception.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Perception.

  ## Examples

      iex> delete_perception(perception)
      {:ok, %Perception{}}

      iex> delete_perception(perception)
      {:error, %Ecto.Changeset{}}

  """
  def delete_perception(%Perception{} = perception) do
    Repo.delete(perception)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking perception changes.

  ## Examples

      iex> change_perception(perception)
      %Ecto.Changeset{source: %Perception{}}

  """
  def change_perception(%Perception{} = perception) do
    Perception.changeset(perception, %{})
  end
end
