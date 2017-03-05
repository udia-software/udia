defmodule Udia.Web.CommentView do
  use Udia.Web, :view

  def render("comment.json", %{comment: comment}) do
    %{
      id: comment.id,
      body: comment.body,
      user: render_one(comment.user, Udia.Web.UserView, "user.json")
    }
  end
end
