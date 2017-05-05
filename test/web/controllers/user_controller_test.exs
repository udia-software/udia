defmodule Udia.Web.UserControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Accounts

  @create_attrs %{password: "hunter2", username: "udia"}
  @invalid_attrs %{password: "one", username: nil}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index", %{conn: conn} do
    # unauthenticated, throw 403
    conn = get conn, user_path(conn, :index)
    response = json_response(conn, 403)
    assert response == %{"error" => "Not Authenticated"}

    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]
    user = response["user"]

    # test user list on index
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> get(user_path(conn, :index))
    response = json_response(conn, 200)
    assert response["data"] == [user]
  end

  test "paginates all entries on index", %{conn: conn} do
    insert_user(%{username: "alice"})
    insert_user(%{username: "bob"})
    insert_user(%{username: "charlie"})
    insert_user(%{username: "dani"})
    insert_user(%{username: "eileen"})
    insert_user(%{username: "frank"})
    insert_user(%{username: "geralt"})
    insert_user(%{username: "hank"})
    insert_user(%{username: "ivan"})
    insert_user(%{username: "jean"})
    insert_user(%{username: "karyn"})
    insert_user(%{username: "lando"})
    insert_user(%{username: "marty"})
    insert_user(%{username: "nancy"})
    insert_user(%{username: "owen"})
    insert_user(%{username: "poppy"})
    insert_user(%{username: "quinn"})
    insert_user(%{username: "rick"})
    insert_user(%{username: "stanley"})
    insert_user(%{username: "thor"})

    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> get(user_path(conn, :index))
    response = json_response(conn, 200)

    assert response["pagination"] == %{
      "page_number" => 1,
      "page_size" => 10,
      "total_entries" => 21,
      "total_pages" => 3
    }

    insert_user(%{username: "victoria"})
    insert_user(%{username: "walter"})
    insert_user(%{username: "xeno"})
    insert_user(%{username: "yvonne"})
    insert_user(%{username: "zack"})

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> get(user_path(conn, :index), %{"page": 2})
    response = json_response(conn, 200)

    assert response["pagination"] == %{
      "page_number" => 2,
      "page_size" => 10,
      "total_entries" => 26,
      "total_pages" => 3
    }

  end

  test "creates user and renders user when data is valid", %{conn: conn} do
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)

    assert Map.has_key?(response, "token")
    assert Map.has_key?(response, "user")
  end

  test "does not create user and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, user_path(conn, :create), @invalid_attrs
    response = json_response(conn, 422)

    assert response == %{
      "errors" => %{
        "username" => ["can't be blank"],
        "password" => ["should be at least 6 character(s)"]
      }
    }
  end

  test "updates chosen user and renders user when data is valid", %{conn: conn} do
    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]
    user = response["user"]

    # unauthenticated, throw 403
    conn = put conn, user_path(conn, :update, user["username"])
    response = json_response(conn, 403)
    assert response == %{"error" => "Not Authenticated"}

    # authenticated, valid password change
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> put(user_path(conn, :update, user["username"], %{user: %{"password" => "hunter3"}}))
    response = json_response(conn, 201)
    assert response["token"] != jwt
    assert response["user"]["inserted_at"] == user["inserted_at"]
    assert response["user"]["username"] == user["username"]
    assert response["user"]["updated_at"] != user["updated_at"]
  end

  test "does not update chosen user and renders errors when data is invalid", %{conn: conn} do
    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]
    user = response["user"]

    # unauthenticated, throw 403
    conn = put conn, user_path(conn, :update, user["username"])
    response = json_response(conn, 403)
    assert response == %{"error" => "Not Authenticated"}

    # authenticated, invalid password change
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> put(user_path(conn, :update, user["username"], %{user: %{"password" => "one"}}))
    response = json_response(conn, 422)
    assert response == %{"errors" => %{"password" => ["should be at least 6 character(s)"]}}
  end

  test "does not update chosen user and renders errors when user is invalid", %{conn: conn} do
    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]

    mod_user = insert_user(%{username: "bob"})

    # authenticated, invalid password change
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> put(user_path(conn, :update, mod_user.username, %{user: %{"password" => "hunter3"}}))
    response = json_response(conn, 403)
    assert response == %{"error" => "Invalid user"}
  end

  test "deletes chosen user", %{conn: conn} do
    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    jwt = response["token"]
    user = response["user"]

    mod_user = insert_user(%{username: "bob"})

    # Delete fails when unauthenticated
    conn = build_conn()
    |> delete(user_path(conn, :delete, user["username"]))
    response = json_response(conn, 403)
    assert response == %{"error" => "Not Authenticated"}

    # Delete returns success, but doesn't actually delete user because auth doesn't match
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> delete(user_path(conn, :delete, mod_user.username))
    response = json_response(conn, 403)
    assert response == %{"error" => "Invalid user"}

    assert length(Accounts.list_users()) == 2

    # Delete returns success, and deletes the user
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    |> delete(user_path(conn, :delete, user["username"]))
    response = response(conn, 204)
    assert response == ""

    assert length(Accounts.list_users()) == 1
  end

  test "show user by username", %{conn: conn} do
    # create a user, get JWT token and user data object
    conn = post conn, user_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    user = response["user"]

    conn = get conn, user_path(conn, :show, user["username"])
    response = json_response(conn, 200)

    assert response["data"] == user
  end
end
