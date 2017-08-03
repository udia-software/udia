defmodule UdiaWeb.PageControllerTest do
  use UdiaWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get conn, "/"
    assert html_response(conn, 200) =~ "UDIA"
  end
end
