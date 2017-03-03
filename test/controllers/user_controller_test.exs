defmodule Udia.UserControllerTest do
  use Udia.ConnCase

  @request_params %{
    "user" => %{username: "Seto", password: "090909"}
  }

  setup do
    conn = build_conn()
    {:ok, conn: conn}
  end

  test "create an user", %{conn: conn} do
    conn = conn |> post("/users", @request_params)
    user = conn.assigns.current_user

    assert conn.status == 302
    assert redirected_to(conn) == user_path(conn, :index)
    assert user.username == "Seto"
  end

  test "list all users", %{conn: conn} do
    conn = conn
           |> post("/users", @request_params)
           |> get("/users")

    assert html_response(conn, 200) =~ "Listing users"
  end

  test "render user form new", %{conn: conn} do
    conn = get conn, user_path(conn, :new)
    assert html_response(conn, 200) =~ "New User"
  end

  test "show an user", %{conn: conn} do
    conn = conn |> post(user_path(conn, :create), @request_params)
    user_id = conn.assigns.current_user.id
    conn = get conn, user_path(conn, :show, user_id)
    assert html_response(conn, 200) =~ "Showing user"
  end
end
