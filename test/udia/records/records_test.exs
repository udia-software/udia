defmodule Udia.RecordsTest do
  use Udia.DataCase

  alias Udia.Records

  describe "perceptions" do
    alias Udia.Records.Perception

    @valid_attrs %{end_time: "2010-04-17 14:00:00.000000Z", start_time: "2010-04-17 14:00:00.000000Z"}
    @update_attrs %{end_time: "2011-05-18 15:01:01.000000Z", start_time: "2011-05-18 15:01:01.000000Z"}
    @invalid_attrs %{end_time: nil, start_time: nil}

    def perception_fixture(attrs \\ %{}) do
      {:ok, perception} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Records.create_perception()

      perception
    end

    test "list_perceptions/0 returns all perceptions" do
      perception = perception_fixture()
      assert Records.list_perceptions() == [perception]
    end

    test "get_perception!/1 returns the perception with given id" do
      perception = perception_fixture()
      assert Records.get_perception!(perception.id) == perception
    end

    test "create_perception/1 with valid data creates a perception" do
      assert {:ok, %Perception{} = perception} = Records.create_perception(@valid_attrs)
      assert perception.end_time == DateTime.from_naive!(~N[2010-04-17 14:00:00.000000Z], "Etc/UTC")
      assert perception.start_time == DateTime.from_naive!(~N[2010-04-17 14:00:00.000000Z], "Etc/UTC")
    end

    test "create_perception/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Records.create_perception(@invalid_attrs)
    end

    test "update_perception/2 with valid data updates the perception" do
      perception = perception_fixture()
      assert {:ok, perception} = Records.update_perception(perception, @update_attrs)
      assert %Perception{} = perception
      assert perception.end_time == DateTime.from_naive!(~N[2011-05-18 15:01:01.000000Z], "Etc/UTC")
      assert perception.start_time == DateTime.from_naive!(~N[2011-05-18 15:01:01.000000Z], "Etc/UTC")
    end

    test "update_perception/2 with invalid data returns error changeset" do
      perception = perception_fixture()
      assert {:error, %Ecto.Changeset{}} = Records.update_perception(perception, @invalid_attrs)
      assert perception == Records.get_perception!(perception.id)
    end

    test "delete_perception/1 deletes the perception" do
      perception = perception_fixture()
      assert {:ok, %Perception{}} = Records.delete_perception(perception)
      assert_raise Ecto.NoResultsError, fn -> Records.get_perception!(perception.id) end
    end

    test "change_perception/1 returns a perception changeset" do
      perception = perception_fixture()
      assert %Ecto.Changeset{} = Records.change_perception(perception)
    end
  end
end
