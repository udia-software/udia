defmodule UdiaWeb.PostControllerTest do
  use UdiaWeb.ConnCase

  @create_attrs %{content: "some content", title: "some title", type: "text"}
  @update_attrs %{content: "some updated content", title: "some updated title"}
  @invalid_attrs %{content: nil, title: nil, type: nil}
  @journey_params %{description: "some description", title: "some title"}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index", %{conn: conn} do
    # create a user
    user = insert_user()

    # no posts, empty array
    conn = get conn, post_path(conn, :index)
    response = json_response(conn, 200)
    assert response["data"] == []

    # add a post
    post = insert_post(user, @create_attrs)

    # test post list on index
    conn = build_conn()
    |> get(post_path(conn, :index))
    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => post.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "title" => "some title",
      "type" => "text",
      "inserted_at" => String.replace(to_string(post.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(post.updated_at), " ", "T"),
      "journey" => nil
    }]
  end

  test "lists all posts of a user", %{conn: conn} do
    # create a user
    user = insert_user()

    # no posts, empty array
    conn = get conn, post_path(conn, :index, %{"username" => user.username})
    response = json_response(conn, 200)
    assert response["data"] == []

    # add a post
    post = insert_post(user, @create_attrs)

    # add a post that belongs to another user
    user_2 = insert_user()
    insert_post(user_2, @create_attrs)

    # test post list on index
    conn = build_conn()
    |> get(post_path(conn, :index, %{"username" => user.username}))
    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => post.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "title" => "some title",
      "type" => "text",
      "inserted_at" => String.replace(to_string(post.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(post.updated_at), " ", "T"),
      "journey" => nil
    }]
  end

  test "lists posts of a journey", %{conn: conn} do
    # create a user
    user = insert_user()

    #add a journey
    journey = insert_journey(user, @journey_params)

    #create a post referencing the journey
    post_with_journey = insert_post(user, @create_attrs |> Enum.into(%{"journey_id": journey.id}))

    #create a post not referencing the journey
    insert_post(user, @create_attrs)
    
    # test list all posts
    conn = build_conn()
    |> get(post_path(conn, :index), %{})
    response = json_response(conn, 200)
    assert length(response["data"]) == 2

    # test list posts of a specific journey
    conn = build_conn()
    |> get(post_path(conn, :index), %{"journey_id": journey.id})
    response = json_response(conn, 200)
    assert length(response["data"]) == 1
    assert Enum.at(response["data"], 0)["id"] == post_with_journey.id
    assert Enum.at(response["data"], 0)["journey"]["id"] == journey.id

    # test lists posts of an non-existent journey
    conn = build_conn()
    |> get(post_path(conn, :index), %{"journey_id": 1234567890})
    response = json_response(conn, 200)
    assert length(response["data"]) == 0
  end

  test "show post given id", %{conn: conn} do
    # Create the user, post
    user = insert_user()
    post = insert_post(user, @create_attrs)

    # Show the post
    conn = get conn, post_path(conn, :show, post.id)
    response = json_response(conn, 200)
    assert response["data"] == %{
      "id" => post.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "title" => "some title",
      "type" => "text",
      "inserted_at" => String.replace(to_string(post.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(post.updated_at), " ", "T"),
      "journey" => nil
    }

    # Throw a 404 (fallback controller)
    assert_raise Ecto.NoResultsError, fn ->
      get conn, post_path(conn, :show, -1)
    end
  end

  test "creates post and renders post when data is valid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(%{username: "udia", password: "hunter2"})
    conn = post conn, session_path(conn, :create), %{username: "udia", password: "hunter2"}
    jwt = json_response(conn, 201)["token"]

    # create a post
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, post_path(conn, :create), @create_attrs
    response = json_response(conn, 201)
    assert response["data"]["id"]
    assert response["data"]["type"] == "text"
    assert response["data"]["title"] == "some title"
    assert response["data"]["content"] == "some content"
    assert response["data"]["author"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["inserted_at"]
    assert response["data"]["updated_at"]
  end

  test "does not create post and renders errors when data is invalid", %{conn: conn} do
    # not logged in, throw unauthorized
    conn = post conn, post_path(conn, :create), @create_attrs
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Not Authenticated"
    }

    # create a user and get the login token
    user_params = %{username: "udia", password: "hunter2"}
    insert_user(user_params)
    conn = post conn, session_path(conn, :create), user_params
    jwt = json_response(conn, 201)["token"]

    # create a post
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, post_path(conn, :create), @invalid_attrs
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "type" => ["can't be blank"],
        "title" => ["can't be blank"],
        "content" => ["can't be blank"]
      }
    }
  end

  test "updates chosen post and renders post when data is valid", %{conn: conn} do
    # create a user and post
    user_params = %{username: "udia", password: "hunter2"}
    user = insert_user(user_params)
    post = insert_post(user, @create_attrs)

    # get JWT
    conn = post conn, session_path(conn, :create), user_params
    jwt = json_response(conn, 201)["token"]

    # update a post
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, post_path(conn, :update, post.id), %{"post" => @update_attrs}
    response = json_response(conn, 202)
    assert response["data"]["id"] == post.id
    assert response["data"]["author"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["content"] == "some updated content"
    assert response["data"]["title"] == "some updated title"
    assert response["data"]["type"] == "text"
    assert response["data"]["inserted_at"] == String.replace(to_string(post.inserted_at), " ", "T")
    assert response["data"]["updated_at"] > String.replace(to_string(post.updated_at), " ", "T")
  end

  test "does not update chosen post and renders errors when data is invalid", %{conn: conn} do
    # create a user and post
    user_params = %{username: "udia", password: "hunter2"}
    user = insert_user(user_params)
    post = insert_post(user, @create_attrs)

    # attempt to update with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, post_path(conn, :update, post.id), %{"post" => @update_attrs}
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }

    # attempt to update with bad data
    conn = post conn, session_path(conn, :create), user_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, post_path(conn, :update, post.id), %{"post" => @invalid_attrs}
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "type" => ["can't be blank"],
        "title" => ["can't be blank"],
        "content" => ["can't be blank"]
      }
    }
  end

  test "deletes chosen post when data is valid", %{conn: conn} do
    # create the user, post to delete
    user_params = %{username: "udia", password: "hunter2"}
    user = insert_user(user_params)
    post = insert_post(user, @create_attrs)

    # delete the post
    conn = post conn, session_path(conn, :create), user_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, post_path(conn, :delete, post.id)
    assert response(conn, 204) == ""
  end

  test "does not delete chosen post when data is invalid", %{conn: conn} do
    # create the user, post to delete
    user_params = %{username: "udia", password: "hunter2"}
    user = insert_user(user_params)
    post = insert_post(user, @create_attrs)

    # attempt to delete with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, post_path(conn, :delete, post.id)
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }

    # attempt to delete a non-existant post
    conn = post conn, session_path(conn, :create), user_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    assert_raise Ecto.NoResultsError, fn ->
      delete conn, post_path(conn, :delete, -1)
    end
  end
end
