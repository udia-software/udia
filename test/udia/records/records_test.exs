defmodule Udia.RecordsTest do
  use Udia.DataCase

  alias Udia.Records

  describe "perceptions" do
    alias Udia.Records.Perception

    @user_params %{username: "udia", password: "hunter2"}
    @post_params %{content: "some content", title: "some title", type: "text"}
    @valid_attrs %{end_time: "2010-04-17 14:30:00.000000Z", start_time: "2010-04-17 14:00:00.000000Z", counter: 1}
    @update_attrs %{end_time: "2011-05-18 15:01:01.000000Z", counter: 2}
    @invalid_attrs %{end_time: nil, start_time: nil}

    test "list_perceptions/0 returns all perceptions" do
      assert Records.list_perceptions() == []
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert Records.list_perceptions() == [perception]
    end

    test "get_perception!/1 returns the perception with given id" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert Records.get_perception!(perception.id) == perception
    end

    test "create_perception/1 with valid data creates a perception" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)

      assert {
        :ok, %Perception{} = perception
      } = Records.create_perception(user, @valid_attrs |> Enum.into(%{
        post_id: post.id
      }))
      assert perception.end_time == DateTime.from_naive!(~N[2010-04-17 14:30:00.000000Z], "Etc/UTC")
      assert perception.start_time == DateTime.from_naive!(~N[2010-04-17 14:00:00.000000Z], "Etc/UTC")
    end

    test "create_perception/1 with invalid data returns error changeset" do
      user = insert_user(@user_params)
      assert {:error, %Ecto.Changeset{}} = Records.create_perception(user, @invalid_attrs)
    end

    test "update_perception/2 with valid data updates the perception" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert {:ok, perception} = Records.update_perception(perception, @update_attrs)
      assert %Perception{} = perception
      assert perception.end_time == DateTime.from_naive!(~N[2011-05-18 15:01:01.000000Z], "Etc/UTC")
      assert perception.start_time == DateTime.from_naive!(~N[2010-04-17 14:00:00.000000Z], "Etc/UTC")
    end

    test "update_perception/2 with invalid data returns error changeset" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert {:error, %Ecto.Changeset{}} = Records.update_perception(perception, @invalid_attrs)
      assert perception == Records.get_perception!(perception.id)
    end

    test "delete_perception/1 deletes the perception" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert {:ok, %Perception{}} = Records.delete_perception(perception)
      assert_raise Ecto.NoResultsError, fn -> Records.get_perception!(perception.id) end
    end

    test "change_perception/1 returns a perception changeset" do
      user = insert_user(@user_params)
      post = insert_post(user, @post_params)
      perception = insert_perception(user, post, @valid_attrs)

      assert %Ecto.Changeset{} = Records.change_perception(perception)
    end
  end
end
