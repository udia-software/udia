defmodule Udia.Web.UserView do
  use Udia.Web, :view
  alias Udia.Web.UserView

  def render("index.json", %{users: users, pagination: pagination}) do
    %{
      data: render_many(users, UserView, "user.json"),
      pagination: pagination
    }
  end

  def render("show.json", %{user: user}) do
    %{data: render_one(user, UserView, "user.json")}
  end

  def render("user.json", %{user: user}) do
    %{username: user.username,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at}
  end
end
