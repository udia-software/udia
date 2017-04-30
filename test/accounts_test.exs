defmodule Udia.AccountsTest do
  use Udia.DataCase

  alias Udia.Accounts
  alias Udia.Accounts.User

  @create_attrs %{username: "udia", password: "hunter2"}

  # test "list_users/1 returns all users"

  # test "get_user! returns the user with given id"

  test "create_user/1 with valid data creates a user" do
    assert {:ok, %User{} = user} = Accounts.create_user(@create_attrs)
    assert user.password_hash
    assert user.username == "udia"
    assert Map.has_key?(user, :inserted_at)
    assert Map.has_key?(user, :updated_at)
    assert Map.has_key?(user, :id)
  end

  test "create_user/1 with invalid data returns error changeset"

  test "update_user/2 with valid data updates the user"

  test "update_user/2 with invalid data returns error changeset"

  test "delete_user/1 deletes the user"

  test "change_user/1 returns a user changeset"
end
