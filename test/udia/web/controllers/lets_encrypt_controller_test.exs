defmodule UdiaWeb.LetsEncryptControllerTest do
  use UdiaWeb.ConnCase

  test "GET /.well-known/acme-challenge/:id", %{conn: conn} do
    conn = get conn, "/.well-known/acme-challenge/udia"
    assert text_response(conn, 200) =~ "NO_CHALLENGE"
  end
end
