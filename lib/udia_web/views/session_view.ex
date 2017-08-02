defmodule UdiaWeb.SessionView do
  use UdiaWeb, :view

  def render("show.json", %{user: user, jwt: jwt}) do
    %{
      user: render_one(user, UdiaWeb.UserView, "user.json"),
      token: jwt
    }
  end

  def render("error.json", %{error: error}) do
    %{error: error}
  end

  def render("forbidden.json", %{error: error}) do
    %{error: error}
  end

  def render("delete.json", _) do
    %{ok: true}
  end
end
