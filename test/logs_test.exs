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

  test "list_posts/1 returns all posts" do
    post = fixture(:post)
    assert Logs.list_posts() == [post]
  end

  test "get_post! returns the post with given id" do
    post = fixture(:post)
    assert Logs.get_post!(post.id) == post
  end

  test "create_post/1 with valid data creates a post" do
    assert {:ok, %Post{} = post} = Logs.create_post(@create_attrs)
    assert post.content == "some content"
    assert post.title == "some title"
    assert post.type == "some type"
  end

  test "create_post/1 with invalid data returns error changeset" do
    assert {:error, %Ecto.Changeset{}} = Logs.create_post(@invalid_attrs)
  end

  test "update_post/2 with valid data updates the post" do
    post = fixture(:post)
    assert {:ok, post} = Logs.update_post(post, @update_attrs)
    assert %Post{} = post
    assert post.content == "some updated content"
    assert post.title == "some updated title"
    assert post.type == "some updated type"
  end

  test "update_post/2 with invalid data returns error changeset" do
    post = fixture(:post)
    assert {:error, %Ecto.Changeset{}} = Logs.update_post(post, @invalid_attrs)
    assert post == Logs.get_post!(post.id)
  end

  test "delete_post/1 deletes the post" do
    post = fixture(:post)
    assert {:ok, %Post{}} = Logs.delete_post(post)
    assert_raise Ecto.NoResultsError, fn -> Logs.get_post!(post.id) end
  end

  test "change_post/1 returns a post changeset" do
    post = fixture(:post)
    assert %Ecto.Changeset{} = Logs.change_post(post)
  end
end
