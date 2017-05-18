defmodule Udia.Web.PostControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Logs

  @create_attrs %{content: "some content", title: "some title", type: "text"}
  @invalid_attrs %{content: nil, title: nil, type: nil}

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
      "author" => %{
        "username" => user.username,
        "inserted_at" => String.replace(to_string(user.inserted_at), " ", "T"),
        "updated_at" => String.replace(to_string(user.updated_at), " ", "T"),
      },
      "content" => "some content", "id" => post.id, "title" => "some title",
      "type" => "text",
      "inserted_at" => String.replace(to_string(post.inserted_at), " ", "T"),
      "updated_at" => String.replace(to_string(post.updated_at), " ", "T"),
    }]

  end

  test "creates post and renders post when data is valid"

  test "does not create post and renders errors when data is invalid"

  test "updates chosen post and renders post when data is valid"

  test "does not update chosen post and renders errors when data is invalid"
end
