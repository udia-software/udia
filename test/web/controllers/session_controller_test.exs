defmodule Udia.Web.SessionControllerTest do
  use Udia.Web.ConnCase

  @login_attrs %{username: "udia", password: "hunter2"}
  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "authenticate user when data is valid", %{conn: conn} do
    user = insert_user(@login_attrs)
    conn = post conn, session_path(conn, :create), @login_attrs
    response = json_response(conn, 201)

    assert Map.has_key?(response, "token")
    assert Map.has_key?(response, "user")
    assert response["user"]["username"] == user.username
  end

  test "unauthenticate session route revokes jwt and returns OK", %{conn: conn} do
    insert_user(@login_attrs)
    conn = post conn, session_path(conn, :create), @login_attrs
    assert json_response(conn, 201)
    assert Map.has_key?(conn.assigns, :jwt)

    conn = delete conn, session_path(conn, :delete)
    assert json_response(conn, 200)["ok"] === true
    assert !Map.has_key?(conn.assigns, :jwt)
  end

  test "refresh session route returns new jwt on authenticated sessions", %{conn: conn} do
    insert_user(@login_attrs)
    # Login
    conn = post conn, session_path(conn, :create), @login_attrs
    assert json_response(conn, 201)
    old_jwt = json_response(conn, 201)["token"]

    # Refresh the token
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{old_jwt}")
    conn = post conn, session_path(conn, :refresh)
    assert json_response(conn, 200)
    new_jwt = json_response(conn, 200)["token"]

    # Assert tokens are not equal
    assert old_jwt !== new_jwt

    # Ensure the new token is valid
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{new_jwt}")
    conn = post conn, session_path(conn, :refresh)
    assert json_response(conn, 200)

    # Ensure the old token is not valid
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{old_jwt}")
    conn = post conn, session_path(conn, :refresh)
    response = json_response(conn, 403)
    assert response["error"] == "Not Authenticated"
  end

  test "refresh session route returns unauthenticated on unauthenticated sessions", %{conn: conn} do
    conn = post conn, session_path(conn, :refresh)
    response = json_response(conn, 403)
    assert response["error"] == "Not Authenticated"
  end

  test "does not authenticate user when data is invalid (bad username)", %{conn: conn} do
    insert_user(@login_attrs)
    conn = post conn, session_path(conn, :create), %{username: "idea", password: "hunter2"}
    response = json_response(conn, 401)
    assert response["error"] == "Invalid username or password"
  end

  test "does not authenticate user when data is invalid (bad password)", %{conn: conn} do
    insert_user(@login_attrs)
    conn = post conn, session_path(conn, :create), %{username: "udia", password: "hunter1"}
    response = json_response(conn, 401)
    assert response["error"] == "Invalid username or password"
  end

  test "does not authenticate user when data is invalid (nil)", %{conn: conn} do
    insert_user(@login_attrs)
    conn = post conn, session_path(conn, :create), %{username: nil, password: nil}
    response = json_response(conn, 401)
    assert response["error"] == "Invalid username or password"
  end
end
