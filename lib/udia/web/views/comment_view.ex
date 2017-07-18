defmodule Udia.Web.CommentView do
  use Udia.Web, :view
  alias Udia.Web.CommentView
  alias Udia.Web.UserView

  def render("index.json", %{comments: comments, pagination: pagination}) do
    %{
      data: render_many(comments, CommentView, "comment.json"),
      pagination: pagination
    }
  end

  def render("show.json", %{comment: comment}) do
    %{data: render_one(comment, CommentView, "comment.json")}
  end

  def render("comment.json", %{comment: comment}) do
    %{id: comment.id,
      content: comment.content,
      type: comment.type,
      inserted_at: comment.inserted_at,
      updated_at: comment.updated_at,
      post_id: comment.post_id,
      children_ids: comment.children,
      parent_id: comment.parent,
      author: render_one(comment.author, UserView, "user.json")}
  end
end
