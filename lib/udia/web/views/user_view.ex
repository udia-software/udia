defmodule Udia.Web.UserView do
  use Udia.Web, :view
  alias Udia.Web.UserView

  def render("index.json", %{users: users}) do
    %{data: render_many(users, UserView, "user.json")}
  end

  def render("show.json", %{user: user}) do
    %{data: render_one(user, UserView, "user.json")}
  end

  def render("user.json", %{user: user}) do
    %{id: user.id,
      username: user.username,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at}
  end
end
