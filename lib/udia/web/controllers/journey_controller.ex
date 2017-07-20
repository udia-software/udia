defmodule Udia.Web.JourneyController do
  use Udia.Web, :controller

  alias Udia.Logs
  alias Udia.Logs.Journey

  action_fallback Udia.Web.FallbackController

  def index(conn, _params) do
    journeys = Logs.list_journeys()
    render(conn, "index.json", journeys: journeys)
  end

  def create(conn, %{"journey" => journey_params}) do
    with {:ok, %Journey{} = journey} <- Logs.create_journey(journey_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", journey_path(conn, :show, journey))
      |> render("show.json", journey: journey)
    end
  end

  def show(conn, %{"id" => id}) do
    journey = Logs.get_journey!(id)
    render(conn, "show.json", journey: journey)
  end

  def update(conn, %{"id" => id, "journey" => journey_params}) do
    journey = Logs.get_journey!(id)

    with {:ok, %Journey{} = journey} <- Logs.update_journey(journey, journey_params) do
      render(conn, "show.json", journey: journey)
    end
  end

  def delete(conn, %{"id" => id}) do
    journey = Logs.get_journey!(id)
    with {:ok, %Journey{}} <- Logs.delete_journey(journey) do
      send_resp(conn, :no_content, "")
    end
  end
end
