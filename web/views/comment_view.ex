defmodule Udia.CommentView do
  use Udia.Web, :view

  def render("comment.json", %{comment: comment}) do
    %{
      id: comment.id,
      body: comment.body,
      user: render_one(comment.user, Udia.UserView, "user.json")
    }
  end
end
