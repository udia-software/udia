defmodule Udia.Logs do
  @moduledoc """
  The boundary for the Logs system.
  """

  import Ecto.{Query, Changeset}, warn: false
  alias Udia.Repo

  alias Udia.Accounts.User
  alias Udia.Logs.Post
  alias Udia.Logs.Comment

  @doc """
  Returns the list of posts.

  ## Examples

      iex> list_posts()
      [%Post{}, ...]

  """
  def list_posts do
    Post
    |> Repo.all()
  end

  @doc """
  Gets a single post.

  Raises `Ecto.NoResultsError` if the Post does not exist.

  ## Examples

      iex> get_post!(123)
      %Post{}

      iex> get_post!(456)
      ** (Ecto.NoResultsError)

  """
  def get_post!(id) do
    Post
    |> Repo.get!(id)
  end
 
  @doc """
  Creates a post.

  ## Examples

      iex> create_post(%{field: value})
      {:ok, %Post{}}

      iex> create_post(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_post(%User{} = user, attrs \\ %{}) do
    user
    |> Ecto.build_assoc(:posts)
    |> Post.changeset(attrs)
    |> PaperTrail.insert(user: user)
  end

  @doc """
  Updates a post.

  ## Examples

      iex> update_post(post, %{field: new_value})
      {:ok, %Post{}}

      iex> update_post(post, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_post(%User{} = user, %Post{} = post, attrs) do
    post
    |> Post.changeset(attrs)
    |> PaperTrail.update(user: user)
  end

  @doc """
  Deletes a Post.

  ## Examples

      iex> delete_post(post)
      {:ok, %Post{}}

      iex> delete_post(post)
      {:error, %Ecto.Changeset{}}

  """
  def delete_post(%Post{} = post) do
    post
    |> PaperTrail.delete()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking post changes.

  ## Examples

      iex> change_post(post)
      %Ecto.Changeset{source: %Post{}}

  """
  def change_post(%Post{} = post) do
    Post.changeset(post, %{})
  end

  @doc """
  Returns the list of comments.

  ## Examples

      iex> list_comments()
      [%Comment{}, ...]

  """
  def list_comments do
    Repo.all(Comment)
  end

  @doc """
  Gets a single comment.

  Raises `Ecto.NoResultsError` if the Comment does not exist.

  ## Examples

      iex> get_comment!(123)
      %Comment{}

      iex> get_comment!(456)
      ** (Ecto.NoResultsError)

  """
  def get_comment!(id), do: Repo.get!(Comment, id)

  @doc """
  Creates a comment.

  ## Examples

      iex> create_comment(%{field: value})
      {:ok, %Comment{}}

      iex> create_comment(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_comment(%User{} = user, attrs \\ %{}) do
    user
    |> Ecto.build_assoc(:comments)
    |> Comment.changeset(attrs)
    |> PaperTrail.insert(user: user)
  end

  @doc """
  Updates a comment.

  ## Examples

      iex> update_comment(comment, %{field: new_value})
      {:ok, %Comment{}}

      iex> update_comment(comment, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_comment(%User{} = user, %Comment{} = comment, attrs) do
    comment
    |> Comment.changeset(attrs)
    |> PaperTrail.update(user: user)
  end

  @doc """
  Deletes a Comment.

  ## Examples

      iex> delete_comment(comment)
      {:ok, %Comment{}}

      iex> delete_comment(comment)
      {:error, %Ecto.Changeset{}}

  """
  def delete_comment(%Comment{} = comment) do
    PaperTrail.delete(comment)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking comment changes.

  ## Examples

      iex> change_comment(comment)
      %Ecto.Changeset{source: %Comment{}}

  """
  def change_comment(%Comment{} = comment) do
    Comment.changeset(comment, %{})
  end

  alias Udia.Logs.Journey

  @doc """
  Returns the list of journeys.

  ## Examples

      iex> list_journeys()
      [%Journey{}, ...]

  """
  def list_journeys do
    Repo.all(Journey)
  end

  @doc """
  Gets a single journey.

  Raises `Ecto.NoResultsError` if the Journey does not exist.

  ## Examples

      iex> get_journey!(123)
      %Journey{}

      iex> get_journey!(456)
      ** (Ecto.NoResultsError)

  """
  def get_journey!(id), do: Repo.get!(Journey, id)

  @doc """
  Creates a journey.

  ## Examples

      iex> create_journey(%{field: value})
      {:ok, %Journey{}}

      iex> create_journey(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_journey(%User{} = user, attrs \\ %{}) do
    user 
    |> Ecto.build_assoc(:journeys)
    |> Journey.changeset(attrs)
    |> PaperTrail.insert(user: user)
  end

  @doc """
  Updates a journey.

  ## Examples

      iex> update_journey(journey, %{field: new_value})
      {:ok, %Journey{}}

      iex> update_journey(journey, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_journey(%User{} = user, %Journey{} = journey, attrs) do
    journey
    |> Journey.changeset(attrs)
    |> PaperTrail.update(user: user)
  end

  @doc """
  Deletes a Journey.

  ## Examples

      iex> delete_journey(journey)
      {:ok, %Journey{}}

      iex> delete_journey(journey)
      {:error, %Ecto.Changeset{}}

  """
  def delete_journey(%Journey{} = journey) do
    Repo.delete(journey)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking journey changes.

  ## Examples

      iex> change_journey(journey)
      %Ecto.Changeset{source: %Journey{}}

  """
  def change_journey(%Journey{} = journey) do
    Journey.changeset(journey, %{})
  end
end
