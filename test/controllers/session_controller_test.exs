defmodule Udia.SessionControllerTest do
  use Udia.ConnCase

  @session_opts Plug.Session.init [
    store: :cookie,
    key: "_test",
    encryption_salt: "abcdef",
    signing_salt: "abcdef"
  ]

  setup do
    user = insert_user(username: "seto", password: "090909")
    conn = build_conn()
    |> assign(:current_user, user)
    |> Plug.Session.call(@session_opts)
    |> Plug.Conn.fetch_session

    {:ok, conn: conn, user: user}
  end

  test "create a new session", %{conn: conn} do
    session_params = %{
      "session" => %{"username" => "seto", "password" => "090909"}
    }

    conn = post conn, session_path(conn, :create), session_params

    assert get_flash(conn, :info) == "Welcome back, seto."
    assert redirected_to(conn) == node_path(conn, :index)
    assert conn.status == 302
  end

  test "delete a session", %{conn: conn} do
    conn = delete conn, session_path(conn, :delete, "")
    assert conn.status == 404
  end

  test "render new session template", %{conn: conn} do
    conn = get conn, session_path(conn, :new)
    assert html_response(conn, 200) =~ "Login"
  end
end
