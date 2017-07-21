defmodule Udia.Web.JourneyController do
  use Udia.Web, :controller

  alias Udia.Logs
  alias Udia.Logs.Journey

  plug Guardian.Plug.EnsureAuthenticated, [handler: Udia.Web.SessionController] when action in [:create, :update, :delete]

  action_fallback Udia.Web.FallbackController

  def index(conn, _params) do
    journeys = Logs.list_journeys()
    |> Udia.Repo.preload(:explorer)
    |> Udia.Repo.preload(posts: :author)

    render(conn, "index.json", journeys: journeys)
  end

  def create(conn, journey_params) do
    cur_user = Guardian.Plug.current_resource(conn)
    case Logs.create_journey(cur_user, journey_params) do
      {:ok, journey_versioned} ->
        journey = Map.get(journey_versioned, :model)
        |> Udia.Repo.preload(:explorer)
        |> Udia.Repo.preload(posts: :author)
       
        conn
        |> put_status(:created)
        |> put_resp_header("location", journey_path(conn, :show, journey))
        |> render("show.json", journey: journey)
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(Udia.Web.ChangesetView, "error.json", changeset: changeset)

    end
  end

  def show(conn, %{"id" => id}) do
    journey = Logs.get_journey!(id)
    journey = Udia.Repo.preload(journey, :explorer)
    journey = Udia.Repo.preload(journey, :posts)
    render(conn, "show.json", journey: journey)
  end

  def update(conn, %{"id" => id, "journey" => journey_params}) do
    journey = Logs.get_journey!(id)

    cur_user = Guardian.Plug.current_resource(conn)
    if cur_user.id != journey.explorer_id do
      conn
      |> put_status(:forbidden)
      |> render(Udia.Web.SessionView, "forbidden.json", error: "Invalid user")
    else
      case Logs.update_journey(cur_user, journey, journey_params) do
        {:ok, journey_versioned} ->
          journey = Map.get(journey_versioned, :model)
          journey = Udia.Repo.preload(journey, :explorer)
          journey = Udia.Repo.preload(journey, :posts)

          conn
          |> put_status(:accepted)
          |> render("show.json", journey: journey)
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> render(Udia.Web.ChangesetView, "error.json", changeset: changeset)
      end
    end
  end

  def delete(conn, %{"id" => id}) do
    cur_user = Guardian.Plug.current_resource(conn)
    journey = Logs.get_journey!(id)

    if cur_user.id != journey.explorer_id do
      conn
      |> put_status(:forbidden)
      |> render(Udia.Web.SessionView, "forbidden.json", error: "Invalid user")
    else
      Logs.delete_journey(journey)
      send_resp(conn, :no_content, "")      
    end
  end
end
