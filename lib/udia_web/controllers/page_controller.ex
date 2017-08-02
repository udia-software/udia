defmodule UdiaWeb.PageController do
  use UdiaWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
