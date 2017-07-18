defmodule Udia.Web.CommentController do
  use Udia.Web, :controller

  import Ecto.Query
  alias Udia.Logs
  alias Udia.Logs.Comment

  plug Guardian.Plug.EnsureAuthenticated, [handler: Udia.Web.SessionController] when action in [:create, :update, :delete]

  action_fallback Udia.Web.FallbackController

  def index(conn, params) do
    page = 
      Comment
      |> order_by(desc: :updated_at)
      |> Udia.Repo.paginate(params)
    comments = page.entries
      |> Udia.Repo.preload(:author)
    render(conn, "index.json", comments: comments, pagination: Udia.PaginationHelpers.pagination(page))
  end

  def create(conn, comment_params) do
    cur_user = Guardian.Plug.current_resource(conn)
    case Logs.create_comment(cur_user, comment_params) do
      {:ok, comment_versioned} ->
        comment = Map.get(comment_versioned, :model)
        comment = Udia.Repo.preload(comment, :author)

        conn
        |> put_status(:created)
        |> put_resp_header("location", comment_path(conn, :show, comment))
        |> render("show.json", comment: comment)
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(Udia.Web.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    comment = Logs.get_comment!(id)
    comment = Udia.Repo.preload(comment, :author)
    render(conn, "show.json", comment: comment)
  end

  def update(conn, %{"id" => id, "comment" => comment_params}) do
    comment = Logs.get_comment!(id)
    comment = Udia.Repo.preload(comment, :author)

    cur_user = Guardian.Plug.current_resource(conn)

    if cur_user.id != comment.author_id do
      conn
      |> put_status(:forbidden)
      |> render(Udia.Web.SessionView, "forbidden.json", error: "Invalid user")
    else
      case Logs.update_comment(cur_user, comment, comment_params) do
        {:ok, comment_versioned} ->
          comment = Map.get(comment_versioned, :model)
          comment = Udia.Repo.preload(comment, :author)

          conn
          |> put_status(:accepted)
          |> render("show.json", comment: comment)
        {:error, changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> render(Udia.Web.ChangesetView, "error.json", changeset: changeset)
      end
    end
  end

  def delete(conn, %{"id" => id}) do
    cur_user = Guardian.Plug.current_resource(conn)
    comment = Logs.get_comment!(id)
    if cur_user.id != comment.author.id do
      conn
      |> put_status(:forbidden)
      |> render(Udia.Web.SessionView, "forbidden.json", error: "Invalid user")
    else
      Logs.delete_comment(comment)
      send_resp(conn, :no_content, "")
    end
  end
end
