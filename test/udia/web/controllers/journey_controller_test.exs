defmodule Udia.Web.JourneyControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Logs
  alias Udia.Logs.Journey

  @create_attrs %{description: "some description", title: "some title"}
  @update_attrs %{description: "some updated description", title: "some updated title"}
  @invalid_attrs %{description: nil, title: nil}

  def fixture(:journey) do
    {:ok, journey} = Logs.create_journey(@create_attrs)
    journey
  end

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  test "lists all entries on index", %{conn: conn} do
    conn = get conn, journey_path(conn, :index)
    assert json_response(conn, 200)["data"] == []
  end

  test "creates journey and renders journey when data is valid", %{conn: conn} do
    conn = post conn, journey_path(conn, :create), journey: @create_attrs
    assert %{"id" => id} = json_response(conn, 201)["data"]

    conn = get conn, journey_path(conn, :show, id)
    assert json_response(conn, 200)["data"] == %{
      "id" => id,
      "description" => "some description",
      "title" => "some title"}
  end

  test "does not create journey and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, journey_path(conn, :create), journey: @invalid_attrs
    assert json_response(conn, 422)["errors"] != %{}
  end

  test "updates chosen journey and renders journey when data is valid", %{conn: conn} do
    %Journey{id: id} = journey = fixture(:journey)
    conn = put conn, journey_path(conn, :update, journey), journey: @update_attrs
    assert %{"id" => ^id} = json_response(conn, 200)["data"]

    conn = get conn, journey_path(conn, :show, id)
    assert json_response(conn, 200)["data"] == %{
      "id" => id,
      "description" => "some updated description",
      "title" => "some updated title"}
  end

  test "does not update chosen journey and renders errors when data is invalid", %{conn: conn} do
    journey = fixture(:journey)
    conn = put conn, journey_path(conn, :update, journey), journey: @invalid_attrs
    assert json_response(conn, 422)["errors"] != %{}
  end

  test "deletes chosen journey", %{conn: conn} do
    journey = fixture(:journey)
    conn = delete conn, journey_path(conn, :delete, journey)
    assert response(conn, 204)
    assert_error_sent 404, fn ->
      get conn, journey_path(conn, :show, journey)
    end
  end
end
