defmodule UdiaWeb.PerceptionControllerTest do
  use UdiaWeb.ConnCase

  @user_params %{username: "udia", password: "hunter2"}
  @post_params %{content: "some content", title: "some title", type: "text"}
  @valid_attrs %{end_time: "2010-04-17 14:30:00.000000Z", start_time: "2010-04-17 14:00:00.000000Z", counter: 1}

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all perceptions", %{conn: conn} do
      conn = get conn, perception_path(conn, :index)
      assert json_response(conn, 200)["data"] == []

      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      conn = build_conn()
      |> get(perception_path(conn, :index))
      assert json_response(conn, 200)["data"] == [%{
        "id" => perception.id,
        "user" => %{
          "username" => user.username,
          "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
          "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
        },
        "post_id" => post.id,
        "start_time" => String.replace(to_string(perception.start_time), " ", "T"),
        "end_time" => String.replace(to_string(perception.end_time), " ", "T")
      }]
    end

    test "list perceptions of a user", %{conn: conn} do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      conn = get conn, perception_path(conn, :index, %{"username" => user.username})
      assert json_response(conn, 200)["data"] == [%{
        "id" => perception.id,
        "user" => %{
          "username" => user.username,
          "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
          "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
        },
        "post_id" => post.id,
        "start_time" => String.replace(to_string(perception.start_time), " ", "T"),
        "end_time" => String.replace(to_string(perception.end_time), " ", "T")
      }]

      # perceptions belonging to another user do not show up
      user_2 = insert_user()
      insert_perception(user_2, post, @valid_attrs)

      conn = build_conn()
      |> get(perception_path(conn, :index, %{"username" => user.username}))
      assert json_response(conn, 200)["data"] == [%{
        "id" => perception.id,
        "user" => %{
          "username" => user.username,
          "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
          "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
        },
        "post_id" => post.id,
        "start_time" => String.replace(to_string(perception.start_time), " ", "T"),
        "end_time" => String.replace(to_string(perception.end_time), " ", "T")
      }]
    end

    test "list perceptions of a post", %{conn: conn} do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      conn = get conn, perception_path(conn, :index, %{"post_id" => post.id})
      assert json_response(conn, 200)["data"] == [%{
        "id" => perception.id,
        "user" => %{
          "username" => user.username,
          "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
          "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
        },
        "post_id" => post.id,
        "start_time" => String.replace(to_string(perception.start_time), " ", "T"),
        "end_time" => String.replace(to_string(perception.end_time), " ", "T")
      }]

      # perceptions belonging to another user do not show up
      post_2 = insert_post(user, @post_params)
      insert_perception(user, post_2, @valid_attrs)

      conn = build_conn()
      |> get(perception_path(conn, :index, %{"post_id" => post.id}))
      assert json_response(conn, 200)["data"] == [%{
        "id" => perception.id,
        "user" => %{
          "username" => user.username,
          "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
          "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
        },
        "post_id" => post.id,
        "start_time" => String.replace(to_string(perception.start_time), " ", "T"),
        "end_time" => String.replace(to_string(perception.end_time), " ", "T")
      }]
    end
  end
end
