defmodule Udia.LogsTest do
  use Udia.DataCase

  alias Udia.Logs
  alias Udia.Logs.Post

  @create_attrs %{content: "some content", title: "some title", type: "some type"}
  @update_attrs %{content: "some updated content", title: "some updated title", type: "some updated type"}
  @invalid_attrs %{content: nil, title: nil, type: nil}

  def fixture(:post, attrs \\ @create_attrs) do
    {:ok, post} = Logs.create_post(attrs)
    post
  end

  test "list_posts/1 returns all posts"

  test "get_post! returns the post with given id"

  test "create_post/1 with valid data creates a post"

  test "create_post/1 with invalid data returns error changeset"

  test "update_post/2 with valid data updates the post"

  test "update_post/2 with invalid data returns error changeset"

  test "delete_post/1 deletes the post"

  test "change_post/1 returns a post changeset"
end
