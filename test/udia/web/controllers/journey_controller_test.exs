defmodule Udia.Web.JourneyControllerTest do
  use Udia.Web.ConnCase

  @journey_params %{description: "some description", title: "some title"}
  @update_attrs %{description: "some updated description", title: "some updated title"}
  @invalid_attrs %{description: nil, title: nil}

  @user_params %{username: "zezima", password: "n0valyfe"}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index", %{conn: conn} do
    # create a user
    user = insert_user(@user_params)

    # no posts, empty array
    conn = get conn, journey_path(conn, :index)
    assert json_response(conn, 200)["data"] == []

    # add a journey
    journey = insert_journey(user, @journey_params)

    # test journey list on index
    conn = build_conn()
    |> get(journey_path(conn, :index))
    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => journey.id,
      "explorer" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "title" => journey.title,
      "description" => journey.description,
      "inserted_at" => String.replace(to_string(journey.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(journey.updated_at), " ", "T")
    }]
  end

  test "creates journey and renders journey when data is valid", %{conn: conn} do
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]
    
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, journey_path(conn, :create), @journey_params
    
    response = json_response(conn, 201)
    assert response["data"]["id"]
    assert response["data"]["title"] == @journey_params.title
    assert response["data"]["description"] == @journey_params.description
    assert response["data"]["explorer"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["inserted_at"]
    assert response["data"]["updated_at"]
  end

  test "does not create journey and renders errors when data is invalid", %{conn: conn} do
    insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]  

    # not logged in, throw unauthorized
    conn = post conn, journey_path(conn, :create), @journey_params
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Not Authenticated"
    }

    # create an invalid blank journey
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, journey_path(conn, :create), @invalid_attrs
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "title" => ["can't be blank"],
        "description" => ["can't be blank"]
      }
    }
  end

  test "updates chosen journey and renders journey when data is valid", %{conn: conn} do
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    journey = insert_journey(user, @journey_params)

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, journey_path(conn, :update, journey.id), %{"journey" => @update_attrs}
    response = json_response(conn, 202)
    assert response["data"]["id"]
    assert response["data"]["title"] == @update_attrs.title
    assert response["data"]["description"] == @update_attrs.description
    assert response["data"]["explorer"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["inserted_at"]
    assert response["data"]["updated_at"]
  end

  test "does not update chosen journey and renders errors when data is invalid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a journey
    journey = insert_journey(user, @journey_params)

    # not logged in, throw unauthorized
    conn = put conn, journey_path(conn, :update, journey.id), %{"journey" => @update_attrs}
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Not Authenticated"
    }

    # attempt to update with bad data
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, journey_path(conn, :update, journey.id), %{"journey" => @invalid_attrs}
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "title" => ["can't be blank"],
        "description" => ["can't be blank"]
      }
    }

    # attempt to update with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, journey_path(conn, :update, journey.id), %{"journey" => @update_attrs}
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }
  end

  test "deletes chosen journey", %{conn: conn} do
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    journey = insert_journey(user, @journey_params)

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, journey_path(conn, :delete, journey.id)
    assert response(conn, 204) == ""
  end

  test "does not delete chosen post when data is invalid", %{conn: conn} do
    user = insert_user(@user_params)
    journey = insert_journey(user, @journey_params)

    # attempt to delete with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, journey_path(conn, :delete, journey.id)
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }

    # attempt to delete a non-existant journey
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    assert_raise Ecto.NoResultsError, fn ->
      delete conn, journey_path(conn, :delete, -1)
    end
  end
end
