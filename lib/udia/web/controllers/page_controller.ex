defmodule Udia.Web.PageController do
  use Udia.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
