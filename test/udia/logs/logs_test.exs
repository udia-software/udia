defmodule Udia.LogsTest do
  use Udia.DataCase

  alias Udia.Logs

  describe "posts" do
    alias Udia.Logs.Post

    @user_params %{username: "udia", password: "hunter2"}
    @create_attrs %{content: "some content", title: "some title", type: "text"}
    @update_attrs %{content: "some updated content", title: "some updated title"}
    @invalid_attrs %{content: nil, title: nil, type: nil}
    @journey_params %{description: "some description", title: "some title"}

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

    test "create_post/2 with valid data creates a post" do
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

    test "create_post/2 with a journey creates a post with journey correctly referenced" do
      user = insert_user(@user_params)
      journey = insert_journey(user, @journey_params)

      assert {:ok, %{
        model: %Post{} = post,
        version: %PaperTrail.Version{}
      }} = Logs.create_post(user, @create_attrs |> Enum.into(%{
        journey_id: journey.id
      }))

      assert post.author_id == user.id
      assert post.content == "some content"
      assert post.title == "some title"
      assert post.type == "text"
      assert post.journey_id == journey.id
      assert Map.has_key?(post, :inserted_at)
      assert Map.has_key?(post, :updated_at)
      assert Map.has_key?(post, :id)

      updated_journey = Udia.Logs.get_journey!(journey.id)
      |> Udia.Repo.preload(:posts)
      assert updated_journey.posts == [post]

      post = Udia.Repo.preload(post, :journey)
      assert post.journey.title == journey.title
    end

    test "create_post/2 with invalid data returns error changeset" do
      user = insert_user(@user_params)
      assert {:error, %Ecto.Changeset{} = err} = Logs.create_post(user, @invalid_attrs)
      assert err.errors == [
        title: {"can't be blank", [validation: :required]},
        type: {"can't be blank", [validation: :required]},
        content: {"can't be blank", [validation: :required]}
      ]
    end

    test "update_post/3 with valid data updates the post" do
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

    test "update_post/3 with invalid data returns error changeset" do
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
        Logs.get_post!(post.id)
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

  describe "comments" do
    alias Udia.Logs.Comment

    @user_params %{username: "udia", password: "hunter2"}
    @post_params %{content: "Popular Test Post", title: "This Post Dawg", type: "text"}

    @create_attrs %{content: "some content", type: "text"}
    @update_attrs %{content: "some updated content", type: "text"}
    @invalid_attrs %{author: nil, content: nil, type: nil}

    test "list_comments/0 returns all comments" do
      assert Logs.list_comments() == []

      user = insert_user(@user_params)
      post = insert_post(user, @post_params)

      comment = insert_comment(user, post, @create_attrs)
      assert Logs.list_comments() == [comment]
    end

    test "get_comment!/1 returns the comment with given id" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)

      comment = insert_comment(user, post, @create_attrs)

      assert Logs.get_comment!(comment.id) == comment
      assert_raise Ecto.NoResultsError, fn ->
        Logs.get_comment!(-1)
      end
    end

    test "create_comment/2 with valid data creates a comment" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)

      assert {:ok, %{
        model: %Comment{} = comment,
        version: %PaperTrail.Version{}
      }} = Logs.create_comment(user, @create_attrs |> Enum.into(%{
        post_id: post.id
      }))

      assert comment.author_id == user.id
      assert comment.content == "some content"
      assert comment.type == "text"
      assert Map.has_key?(comment, :inserted_at)
      assert Map.has_key?(comment, :updated_at)
      assert Map.has_key?(comment, :id)
      assert Map.has_key?(comment, :post_id)

      updated_post = Udia.Logs.get_post!(post.id)
      |> Udia.Repo.preload(:comments)
      assert updated_post.comments == [comment]
    end

    test "create_comment/2 with invalid data returns error changeset" do
      user = insert_user(@user_params)

      assert {:error, %Ecto.Changeset{} = err} = Logs.create_comment(user, @invalid_attrs)
      assert err.errors == [
        content: {"can't be blank", [validation: :required]},
        type: {"can't be blank", [validation: :required]},
        post_id: {"can't be blank", [validation: :required]},
      ]
    end

    test "update_comment/3 with valid data updates the comment" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      base_comment = insert_comment(user, post, @create_attrs)

      assert {:ok, %{
        model: %Comment{} = comment,
        version: %PaperTrail.Version{}
      }} = Logs.update_comment(user, base_comment, @update_attrs)
      assert comment.content == "some updated content"
      assert comment.id == base_comment.id
    end

    test "update_comment/3 with invalid data returns error changeset" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      base_comment = insert_comment(user, post, @create_attrs)

      assert {:error, %Ecto.Changeset{} = err} = Logs.update_comment(user, base_comment, @invalid_attrs)
      assert err.errors == [
        content: {"can't be blank", [validation: :required]},
        type: {"can't be blank", [validation: :required]}
      ]
    end

    test "delete_comment/1 deletes the comment" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      base_comment = insert_comment(user, post, @create_attrs)

      assert {:ok, %{
        model: %Comment{} = comment,
        version: %PaperTrail.Version{}
      }} = Logs.delete_comment(base_comment)

      assert_raise Ecto.NoResultsError, fn ->
        Logs.get_comment!(comment.id)
      end
    end

    test "change_comment/1 returns a comment changeset" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      comment = insert_comment(user, post, @create_attrs)

      changeset = Logs.change_comment(comment)
      assert %Ecto.Changeset{} = changeset
      assert changeset.data == comment
    end
  end

  describe "journeys" do
    alias Udia.Logs.Journey

    @user_params %{username: "ram", password: "dass~~"}
    @journey_params %{description: "some description", title: "some title"}

    @update_attrs %{description: "some updated description", title: "some updated title"}
    @invalid_attrs %{description: nil, title: nil}
    
    test "list_journeys/0 returns all journeys" do
      assert Logs.list_journeys() == []

      user = insert_user(@user_params)
      journey = insert_journey(user, @journey_params)

      assert Logs.list_journeys() == [journey]
    end

    test "get_journey!/1 returns the journey with given id" do
      user = insert_user(@user_params)
      journey = insert_journey(user, @journey_params)
      
      assert Logs.get_journey!(journey.id) == journey
    end

    test "create_journey/1 with valid data creates a journey" do
      user = insert_user(@user_params)
      
      assert {:ok, %{
        model: %Journey{} = journey,
        version: %PaperTrail.Version{}
      }} = Logs.create_journey(user, @journey_params)

      assert journey.description == "some description"
      assert journey.title == "some title"
    end

    test "create_journey/1 with invalid data returns error changeset" do
      user = insert_user(@user_params)

      assert {:error, %Ecto.Changeset{} = err} = Logs.create_journey(user, @invalid_attrs)
      assert err.errors == [
        title: {"can't be blank", [validation: :required]},
        description: {"can't be blank", [validation: :required]}
      ]    
    end

    test "update_journey/2 with valid data updates the journey" do
      user = insert_user(@user_params)
      base_journey = insert_journey(user, @journey_params)

      assert {:ok, %{
        model: %Journey{} = journey,
        version: %PaperTrail.Version{}
      }} = Logs.update_journey(user, base_journey, @update_attrs)
      assert journey.description == "some updated description"
      assert journey.id == base_journey.id
    end

    test "update_journey/2 with invalid data returns error changeset" do
      user = insert_user(@user_params)
      base_journey = insert_journey(user, @journey_params)

      assert {:error, %Ecto.Changeset{} = err} = Logs.update_journey(user, base_journey, @invalid_attrs)
      assert err.errors == [
        title: {"can't be blank", [validation: :required]},
        description: {"can't be blank", [validation: :required]}
      ]
    end

    test "delete_journey/1 deletes the journey" do
      user = insert_user(@user_params)
      journey = insert_journey(user, @journey_params)

      assert {:ok, %{
        model: %Journey{} = journey,
        version: %PaperTrail.Version{}
      }} = Logs.delete_journey(journey)

      assert_raise Ecto.NoResultsError, fn ->
        Logs.get_journey!(journey.id)
      end
    end

    test "change_journey/1 returns a journey changeset" do
      user = insert_user(@user_params)
      journey = insert_journey(user, @journey_params)

      assert %Ecto.Changeset{} = Logs.change_journey(journey)
    end
    
  end
end
