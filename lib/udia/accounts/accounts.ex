defmodule Udia.Accounts do
  @moduledoc """
  The boundary for the Accounts system.
  """

  import Ecto.{Query, Changeset}, warn: false
  alias Udia.Repo

  alias Udia.Accounts.User

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id), do: Repo.get!(User, id)

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user_by_username!("alice")
      %User{}

      iex> get_user_by_username!("bob")
      ** (Ecto.NoResultsError)

  """
  def get_user_by_username!(username), do: Repo.get_by!(User, username: username)

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> user_registration_changeset(attrs)
    |> PaperTrail.insert()
  end

  @doc """
  Updates a user (only allow change password).

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> user_change_password_changeset(attrs)
    |> PaperTrail.update()
  end

  @doc """
  Deletes a User.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    user
    |> PaperTrail.delete()
  end

  defp user_changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_required([:username])
    |> unique_constraint(:username)
  end

  defp user_registration_changeset(%User{} = user, attrs) do
    user
    |> user_changeset(attrs)
    |> cast(attrs, [:password])
    |> validate_length(:password, min: 6, max: 200)
    |> put_password_hash()
  end

  defp user_change_password_changeset(%User{} = user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_length(:password, min: 6, max: 200)
    |> put_password_hash()    
  end

  defp put_password_hash(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
        put_change(changeset, :password_hash, Comeonin.Bcrypt.hashpwsalt(password))
      _ ->
        changeset
    end
  end
end
