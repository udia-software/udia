defmodule Udia.Web.UserControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Accounts
  alias Udia.Accounts.User

  @create_attrs %{password: "hunter2", username: "udia"}
  @nil_attrs %{password_hash: nil, username: nil}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index"

  test "creates user and renders user when data is valid"

  test "does not create user and renders errors when data is invalid"

  test "updates chosen user and renders user when data is valid"

  test "does not update chosen user and renders errors when data is invalid"

  test "deletes chosen user"
end
