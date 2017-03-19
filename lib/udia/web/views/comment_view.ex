defmodule Udia.Web.CommentView do
  use Udia.Web, :view
  alias Udia.Reactions

  def render("comment.json", %{comment: comment}) do
    %{
      id: comment.id,
      parent_id: comment.parent_comment_id,
      body: comment.body,
      point: get_point(comment.id),
      votes: get_votes(comment.id),
      user: render_one(comment.user, Udia.Web.UserView, "user.json")
    }
  end

  defp get_point(comment_id) do
    [point] = Reactions.get_point_comment(comment_id)
    point
  end

  defp get_votes(comment_id) do
    comment_id
    |> Reactions.get_all_vote
    |> Enum.map(fn x -> %{vote: x.vote, user_id: x.user_id} end)
  end
end
