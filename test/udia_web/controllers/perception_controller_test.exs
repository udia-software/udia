defmodule UdiaWeb.PerceptionControllerTest do
  use UdiaWeb.ConnCase

  alias Udia.Records
  alias Udia.Records.Perception

  @create_attrs %{end_time: "2010-04-17 14:00:00.000000Z", start_time: "2010-04-17 14:00:00.000000Z"}
  @update_attrs %{end_time: "2011-05-18 15:01:01.000000Z", start_time: "2011-05-18 15:01:01.000000Z"}
  @invalid_attrs %{end_time: nil, start_time: nil}

  def fixture(:perception) do
    {:ok, perception} = Records.create_perception(@create_attrs)
    perception
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "index" do
    test "lists all perceptions", %{conn: conn} do
      conn = get conn, perception_path(conn, :index)
      assert json_response(conn, 200)["data"] == []
    end
  end

  describe "create perception" do
    test "renders perception when data is valid", %{conn: conn} do
      conn = post conn, perception_path(conn, :create), perception: @create_attrs
      assert %{"id" => id} = json_response(conn, 201)["data"]

      conn = get conn, perception_path(conn, :show, id)
      assert json_response(conn, 200)["data"] == %{
        "id" => id,
        "end_time" => String.replace("2010-04-17 14:00:00.000000Z", " ", "T"),
        "start_time" => String.replace("2010-04-17 14:00:00.000000Z", " ", "T")}
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post conn, perception_path(conn, :create), perception: @invalid_attrs
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "update perception" do
    setup [:create_perception]

    test "renders perception when data is valid", %{conn: conn, perception: %Perception{id: id} = perception} do
      conn = put conn, perception_path(conn, :update, perception), perception: @update_attrs
      assert %{"id" => ^id} = json_response(conn, 200)["data"]

      conn = get conn, perception_path(conn, :show, id)
      assert json_response(conn, 200)["data"] == %{
        "id" => id,
        "end_time" => String.replace("2011-05-18 15:01:01.000000Z", " ", "T"),
        "start_time" => String.replace("2011-05-18 15:01:01.000000Z", " ", "T")}
    end

    test "renders errors when data is invalid", %{conn: conn, perception: perception} do
      conn = put conn, perception_path(conn, :update, perception), perception: @invalid_attrs
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete perception" do
    setup [:create_perception]

    test "deletes chosen perception", %{conn: conn, perception: perception} do
      conn = delete conn, perception_path(conn, :delete, perception)
      assert response(conn, 204)
      assert_error_sent 404, fn ->
        get conn, perception_path(conn, :show, perception)
      end
    end
  end

  defp create_perception(_) do
    perception = fixture(:perception)
    {:ok, perception: perception}
  end
end
