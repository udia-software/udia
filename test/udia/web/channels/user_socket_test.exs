defmodule Udia.Web.UserSocketTest do
  use Udia.Web.ChannelCase, async: true
  alias Udia.Web.UserSocket

  test "socket authentication with valid token" do
    user = insert_user(%{username: "udiasocketboi", password: "hunter2"})
    { :ok, jwt, _full_claims } = Guardian.encode_and_sign(user, :access)

    assert {:ok, socket} = connect(UserSocket, %{"guardian_token" => jwt})
    assert "users_socket:udiasocketboi" = UserSocket.id(socket)
  end

  test "socket authentication with invalid token" do
    # invalid token
    assert {:ok, socket} = connect(UserSocket, %{"guardian_token" => "1313"})
    assert "users_socket:" = UserSocket.id(socket)

    # invalid params
    assert {:ok, socket} = connect(UserSocket, %{})
    assert "users_socket:" = UserSocket.id(socket)
  end
end
