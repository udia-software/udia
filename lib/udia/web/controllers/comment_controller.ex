defmodule Udia.Web.CommentController do
  use Udia.Web, :controller

  alias Udia.Logs
  alias Udia.Logs.Comment

  action_fallback Udia.Web.FallbackController

  def index(conn, _params) do
    comments = Logs.list_comments()
    render(conn, "index.json", comments: comments)
  end

  def create(conn, %{"comment" => comment_params}) do
    with {:ok, %Comment{} = comment} <- Logs.create_comment(comment_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", comment_path(conn, :show, comment))
      |> render("show.json", comment: comment)
    end
  end

  def show(conn, %{"id" => id}) do
    comment = Logs.get_comment!(id)
    render(conn, "show.json", comment: comment)
  end

  def update(conn, %{"id" => id, "comment" => comment_params}) do
    comment = Logs.get_comment!(id)

    with {:ok, %Comment{} = comment} <- Logs.update_comment(comment, comment_params) do
      render(conn, "show.json", comment: comment)
    end
  end

  def delete(conn, %{"id" => id}) do
    comment = Logs.get_comment!(id)
    with {:ok, %Comment{}} <- Logs.delete_comment(comment) do
      send_resp(conn, :no_content, "")
    end
  end
end
