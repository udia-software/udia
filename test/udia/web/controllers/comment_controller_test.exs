defmodule Udia.Web.CommentControllerTest do
  use Udia.Web.ConnCase

  @user_params %{username: "udia", password: "hunter2"}
  @post_params %{content: "Popular Test Post", title: "This Post Dawg", type: "text"}

  @create_attrs %{content: "some content", type: "text"}
  @update_attrs %{content: "some updated content", type: "text"}
  @invalid_attrs %{author: nil, content: nil, type: nil}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index", %{conn: conn} do
    # create a user
    user = insert_user(@user_params)

    # no posts, empty array
    conn = get conn, comment_path(conn, :index)
    assert json_response(conn, 200)["data"] == []

    # add a comment
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    # test post list on index
    conn = build_conn()
    |> get(comment_path(conn, :index))
    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "parent_id" => nil,
      "post_id" => post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(comment.updated_at), " ", "T"),
    }]
  end

  test "lists specific (param) entries on index", %{conn: conn} do
    user = insert_user(@user_params)
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    # Filtering posts
    new_post = insert_post(user)
    new_comment = insert_comment(user, new_post, @create_attrs)

    # Test only getting post comments
    conn = build_conn()
    |> get(comment_path(conn, :index), %{"post_id": post.id})

    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "parent_id" => nil,
      "post_id" => post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(comment.updated_at), " ", "T"),
    }]

    # Test only getting new_post comments
    conn = build_conn()
    |> get(comment_path(conn, :index), %{"post_id": new_post.id})

    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => new_comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "parent_id" => nil,
      "post_id" => new_post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(new_comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(new_comment.updated_at), " ", "T"),
    }]
  end

  test "lists nested (param) entries on index", %{conn: conn} do
    user = insert_user(@user_params)
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)
    nested_comment = insert_comment(user, post, %{
      parent_id: comment.id,
      content: "some nested content",
      type: "text"
    })

    # Test only getting post root comments
    conn = build_conn()
    |> get(comment_path(conn, :index), %{"post_id": post.id})

    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "parent_id" => nil,
      "post_id" => post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(comment.updated_at), " ", "T"),
    }]    

    # Test only getting nested comments
    conn = build_conn()
    |> get(comment_path(conn, :index), %{
      "post_id": post.id,
      "parent_id": comment.id
    })

    response = json_response(conn, 200)
    assert response["data"] == [%{
      "id" => nested_comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some nested content",
      "parent_id" => comment.id,
      "post_id" => post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(nested_comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(nested_comment.updated_at), " ", "T"),
    }]
  end

  test "show comment given id", %{conn: conn} do
    user = insert_user(@user_params)
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    conn = build_conn()
    |> get(comment_path(conn, :show, comment.id))
    response = json_response(conn, 200)
    assert response["data"] == %{
      "id" => comment.id,
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content",
      "parent_id" => nil,
      "post_id" => post.id,
      "type" => "text",
      "inserted_at" => String.replace(to_string(comment.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(comment.updated_at), " ", "T"),
    }
  end

  test "creates comment and renders comment when data is valid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a post
    post = insert_post(user, @post_params)

    # create a comment
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, comment_path(conn, :create), @create_attrs |> Enum.into(%{
      post_id: post.id
    })
    response = json_response(conn, 201)
    assert response["data"]["id"]
    assert response["data"]["parent_id"] == nil
    assert response["data"]["post_id"] == post.id
    assert response["data"]["type"] == "text"
    assert response["data"]["content"] == "some content"
    assert response["data"]["author"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["inserted_at"]
    assert response["data"]["updated_at"]
  end
  
  test "does not create comment and renders errors when data is invalid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a post
    post = insert_post(user, @post_params)

    # not logged in, throw unauthorized
    conn = post conn, comment_path(conn, :create), @create_attrs |> Enum.into(%{
      post_id: post.id
    })
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Not Authenticated"
    }

    # create an invalid blank comment
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = post conn, comment_path(conn, :create), @invalid_attrs
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "content" => ["can't be blank"],
        "post_id" => ["can't be blank"],
        "type" => ["can't be blank"]
      }
    }
  end
  
  test "updates chosen comment and renders comment when data is valid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a post and comment
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    # update a comment
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, comment_path(conn, :update, comment.id), %{"comment" => @update_attrs}
    response = json_response(conn, 202)
    assert response["data"]["id"]
    assert response["data"]["parent_id"] == nil
    assert response["data"]["post_id"] == post.id
    assert response["data"]["type"] == "text"
    assert response["data"]["content"] == "some updated content"
    assert response["data"]["author"] == %{
      "username" => user.username,
      "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
    }
    assert response["data"]["inserted_at"] == String.replace(to_string(comment.inserted_at), " ", "T")
    assert response["data"]["updated_at"]
  end
  
  test "does not update chosen comment and renders errors when data is invalid", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a post
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    # not logged in, throw unauthorized
    conn = put conn, comment_path(conn, :update, comment.id), %{"comment" => @update_attrs}
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Not Authenticated"
    }

    # attempt to update with bad data
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, comment_path(conn, :update, comment.id), %{"comment" => @invalid_attrs}
    response = json_response(conn, 422)
    assert response == %{
      "errors" => %{
        "content" => ["can't be blank"],
        "type" => ["can't be blank"]
      }
    }

    # attempt to update with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = put conn, comment_path(conn, :update, comment.id), %{"comment" => @update_attrs}
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }
  end
  
  test "deletes chosen comment", %{conn: conn} do
    # create a user and get the login token
    user = insert_user(@user_params)
    conn = post conn, session_path(conn, :create), @user_params
    jwt = json_response(conn, 201)["token"]

    # create a post and comment
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, comment_path(conn, :delete, comment.id)
    assert response(conn, 204) == ""
  end

  test "does not delete chosen post when data is invalid", %{conn: conn} do
    user = insert_user(@user_params)
    post = insert_post(user, @post_params)
    comment = insert_comment(user, post, @create_attrs)

    # attempt to delete with another user's JWT
    hacker_params = %{username: "hax", password: "hunter3"}
    insert_user(hacker_params)
    conn = post conn, session_path(conn, :create), hacker_params
    jwt = json_response(conn, 201)["token"]

    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    conn = delete conn, comment_path(conn, :delete, comment.id)
    response = json_response(conn, 403)
    assert response == %{
      "error" => "Invalid user"
    }

    # attempt to delete a non-existant comment
    conn = build_conn()
    |> put_req_header("authorization", "Bearer: #{jwt}")
    assert_raise Ecto.NoResultsError, fn ->
      delete conn, comment_path(conn, :delete, -1)
    end
  end
end
