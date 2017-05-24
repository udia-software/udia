defmodule Udia.LogsTest do
  use Udia.DataCase

  alias Udia.Logs
  alias Udia.Logs.Post

  @user_params %{username: "udia", password: "hunter2"}
  @create_attrs %{content: "some content", title: "some title", type: "text"}
  @update_attrs %{content: "some updated content", title: "some updated title"}
  @invalid_attrs %{content: nil, title: nil, type: nil}

  test "list_posts/1 returns all posts" do
    assert Logs.list_posts() == []

    user = insert_user(@user_params)
    post = insert_post(user, @create_attrs)
    assert Logs.list_posts() == [post]
  end

  test "get_post! returns the post with given id" do
    user = insert_user(@user_params)
    post = insert_post(user, @create_attrs)

    assert Logs.get_post!(post.id) == post
    assert_raise Ecto.NoResultsError, fn ->
      Logs.get_post!(-1)
    end
  end

  test "create_post/1 with valid data creates a post" do
    user = insert_user(@user_params)

    assert {:ok, %{
      model: %Post{} = post,
      version: %PaperTrail.Version{}
    }} = Logs.create_post(user, @create_attrs)
    assert post.author_id == user.id
    assert post.content == "some content"
    assert post.title == "some title"
    assert post.type == "text"
    assert Map.has_key?(post, :inserted_at)
    assert Map.has_key?(post, :updated_at)
    assert Map.has_key?(post, :id)
  end

  test "create_post/1 with invalid data returns error changeset" do
    user = insert_user(@user_params)
    assert {:error, %Ecto.Changeset{} = err} = Logs.create_post(user, @invalid_attrs)
    assert err.errors == [
      title: {"can't be blank", [validation: :required]},
      type: {"can't be blank", [validation: :required]},
      content: {"can't be blank", [validation: :required]}
    ]
  end

  test "update_post/2 with valid data updates the post" do
    user = insert_user(@user_params)
    base_post = insert_post(user, @create_attrs)

    assert {:ok, %{
      model: %Post{} = post,
      version: %PaperTrail.Version{}
    }} = Logs.update_post(user, base_post, @update_attrs)
    assert post.content == "some updated content"
    assert post.title == "some updated title"
    assert post.id == base_post.id
  end

  test "update_post/2 with invalid data returns error changeset" do
    user = insert_user(@user_params)
    base_post = insert_post(user, @create_attrs)

    assert {:error, %Ecto.Changeset{} = err} = Logs.update_post(user, base_post, @invalid_attrs)
    assert err.errors == [
      title: {"can't be blank", [validation: :required]},
      type: {"can't be blank", [validation: :required]},
      content: {"can't be blank", [validation: :required]}
    ]
  end

  test "delete_post/1 deletes the post" do
    user = insert_user(@user_params)
    base_post = insert_post(user, @create_attrs)

    assert {:ok, %{
      model: %Post{} = post,
      version: %PaperTrail.Version{}
    }} = Logs.delete_post(base_post)

    assert_raise Ecto.NoResultsError, fn ->
      Logs.get_post!(base_post.id)
    end
  end

  test "change_post/1 returns a post changeset" do
    user = insert_user(@user_params)
    post = insert_post(user, @create_attrs)

    changeset = Logs.change_post(post)
    assert %Ecto.Changeset{} = changeset
    assert changeset.data == post
  end
end
