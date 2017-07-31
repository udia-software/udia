defmodule UdiaWeb.UserController do
  use UdiaWeb, :controller

  alias Udia.Accounts
  alias Udia.Accounts.User

  plug Guardian.Plug.EnsureAuthenticated, [handler: UdiaWeb.SessionController] when action in [:index, :update, :delete]

  action_fallback UdiaWeb.FallbackController

  def index(conn, params) do
    page = 
      User
      |> Udia.Repo.paginate(params)
    render(conn, "index.json", users: page.entries, pagination: UdiaWeb.PaginationHelpers.pagination(page))
  end

  def create(conn, user_params) do
    case Accounts.create_user(user_params) do
      {:ok, user_versioned} ->
        user = Map.get(user_versioned, :model)
        new_conn = Guardian.Plug.api_sign_in(conn, user, :access)
        jwt = Guardian.Plug.current_token(new_conn)

        new_conn
        |> put_status(:created)
        |> render(UdiaWeb.SessionView, "show.json", user: user, jwt: jwt)
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(UdiaWeb.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def show(conn, %{"id" => username}) do
    user = Accounts.get_user_by_username!(username)
    render(conn, "show.json", user: user)
  end

  def update(conn, %{"id" => username, "user" => user_params}) do
    user = Accounts.get_user_by_username!(username)
    cur_user = Guardian.Plug.current_resource(conn)

    if cur_user.id != user.id do
      conn
      |> put_status(:forbidden)
      |> render(UdiaWeb.SessionView, "forbidden.json", error: "Invalid user")
    else
      case Accounts.update_user(user, user_params) do
        {:ok, user_versioned} ->
          user = Map.get(user_versioned, :model)
          new_conn = Guardian.Plug.api_sign_in(conn, user, :access)
          jwt = Guardian.Plug.current_token(new_conn)

          new_conn
          |> put_status(:accepted)
          |> render(UdiaWeb.SessionView, "show.json", user: user, jwt: jwt)
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> render(UdiaWeb.ChangesetView, "error.json", changeset: changeset)
      end
    end
  end

  def delete(conn, %{"id" => username}) do
    user = Accounts.get_user_by_username!(username)
    cur_user = Guardian.Plug.current_resource(conn)
    if cur_user.id != user.id do
      conn
      |> put_status(:forbidden)
      |> render(UdiaWeb.SessionView, "forbidden.json", error: "Invalid user")
    else
      Accounts.delete_user(user)
      send_resp(conn, :no_content, "")
    end
  end
end
