defmodule Udia.AccountsTest do
  use Udia.DataCase

  alias Udia.Accounts
  alias Udia.Accounts.User

  @create_attrs %{username: "udia", password: "hunter2"}
  @invalid_attrs %{username: nil, password: "one"}

  test "list_users/0 returns all users" do
    assert Accounts.list_users() == []

    insert_user(@create_attrs)
    assert [%User{} = user] = Accounts.list_users()
    assert user.password_hash
    assert user.username == "udia"
    assert Map.has_key?(user, :inserted_at)
    assert Map.has_key?(user, :updated_at)
    assert Map.has_key?(user, :id)
  end

  test "get_user_by_username! returns the user with given username" do
    insert_user(@create_attrs)
    user = Accounts.get_user_by_username!("udia")
    assert user.password_hash
    assert user.username == "udia"
    assert Map.has_key?(user, :inserted_at)
    assert Map.has_key?(user, :updated_at)
    assert Map.has_key?(user, :id)

    assert_raise Ecto.NoResultsError, fn ->
      Accounts.get_user_by_username!("anon")
    end
  end

  test "get_user! returns the user with given id" do
    user = insert_user(@create_attrs)
    user = Accounts.get_user!(user.id)
    assert user.password_hash
    assert user.username == "udia"
    assert Map.has_key?(user, :inserted_at)
    assert Map.has_key?(user, :updated_at)
    assert Map.has_key?(user, :id)
  end

  test "create_user/1 with valid data creates a user" do
    assert {:ok, %User{} = user} = Accounts.create_user(@create_attrs)
    assert user.password_hash
    assert user.username == "udia"
    assert Map.has_key?(user, :inserted_at)
    assert Map.has_key?(user, :updated_at)
    assert Map.has_key?(user, :id)
  end

  test "create_user/1 with invalid data returns error changeset" do
    assert {:error, %Ecto.Changeset{} = err} = Accounts.create_user(@invalid_attrs)
    assert err.errors == [password: {"should be at least %{count} character(s)", [count: 6, validation: :length, min: 6]},
                          username: {"can't be blank", [validation: :required]}]
  end

  test "update_user/2 with valid data updates the user" do
    base_user = insert_user(@create_attrs)
    assert {:ok, %User{} = user} = Accounts.update_user(base_user, %{password: "hunter3"})
    assert base_user.password_hash != user.password_hash
  end

  test "update_user/2 with invalid data returns error changeset" do
    base_user = insert_user(@create_attrs)
    assert {:error, %Ecto.Changeset{} = err} = Accounts.update_user(base_user, %{password: "one"})
    assert err.errors == [password: {"should be at least %{count} character(s)", [count: 6, validation: :length, min: 6]}]
  end

  test "delete_user/1 deletes the user" do
    insert_user(@create_attrs)
    assert [%User{} = user] = Accounts.list_users()
    assert {:ok, %User{}} = Accounts.delete_user(user)
    assert Accounts.list_users() == []
  end
end
