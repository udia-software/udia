defmodule UdiaWeb.JourneyController do
  use UdiaWeb, :controller

  import Ecto.Query
  alias Udia.Logs
  alias Udia.Logs.Journey

  plug Guardian.Plug.EnsureAuthenticated, [handler: UdiaWeb.SessionController] when action in [:create, :update, :delete]

  action_fallback UdiaWeb.FallbackController

  def index(conn, params) do
    page = cond do
      Map.has_key?(params, "username") ->
        username = Map.get(params, "username")
        user = Udia.Accounts.get_user_by_username!(username)

        Journey
        |> where([j], j.explorer_id == ^user.id)
        |> order_by(desc: :updated_at)
        |> Udia.Repo.paginate(params)
      true ->
        Journey
        |> order_by(desc: :updated_at)
        |> Udia.Repo.paginate(params)
    end
    
    journeys = page.entries
      |> Udia.Repo.preload(:explorer)
    render(conn, "index.json", journeys: journeys, pagination: UdiaWeb.PaginationHelpers.pagination(page))
  end

  def create(conn, journey_params) do
    cur_user = Guardian.Plug.current_resource(conn)
    case Logs.create_journey(cur_user, journey_params) do
      {:ok, journey_versioned} ->
        journey = journey_versioned
        |> Map.get(:model)
        |> Udia.Repo.preload(:explorer)
       
        conn
        |> put_status(:created)
        |> put_resp_header("location", journey_path(conn, :show, journey))
        |> render("show.json", journey: journey)
      
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(UdiaWeb.ChangesetView, "error.json", changeset: changeset)

    end
  end

  def show(conn, %{"id" => id}) do
    journey = id
    |> Logs.get_journey!()
    |> Udia.Repo.preload(:explorer)
    render(conn, "show.json", journey: journey)
  end

  def update(conn, %{"id" => id, "journey" => journey_params}) do
    journey = Logs.get_journey!(id)

    cur_user = Guardian.Plug.current_resource(conn)
    if cur_user.id != journey.explorer_id do
      conn
      |> put_status(:forbidden)
      |> render(UdiaWeb.SessionView, "forbidden.json", error: "Invalid user")
    else
      case Logs.update_journey(cur_user, journey, journey_params) do
        {:ok, journey_versioned} ->
          journey = journey_versioned
          |> Map.get(:model)
          |> Udia.Repo.preload(:explorer)

          conn
          |> put_status(:accepted)
          |> render("show.json", journey: journey)
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> render(UdiaWeb.ChangesetView, "error.json", changeset: changeset)
      end
    end
  end

  def delete(conn, %{"id" => id}) do
    cur_user = Guardian.Plug.current_resource(conn)
    journey = Logs.get_journey!(id)

    if cur_user.id != journey.explorer_id do
      conn
      |> put_status(:forbidden)
      |> render(UdiaWeb.SessionView, "forbidden.json", error: "Invalid user")
    else
      Logs.delete_journey(journey)
      send_resp(conn, :no_content, "")      
    end
  end
end
