defmodule Udia.UserSocketTest do
  use Udia.ChannelCase

  test "socket authentication with valid token" do
    token = Phoenix.Token.sign(@endpoint, "user socket", "1234")

    assert {:ok, socket} = connect(UserSocket, %{"token" => token})
    assert socket.assigns.user_id == "1234"
  end

  test "socket authentication with invalid token" do
    assert {:ok, socket} = connect(UserSocket, %{"token" => "1357"})
    assert socket.assigns.user_id == nil
    assert {:ok, socket} = connect(UserSocket, %{})
    assert socket.assigns.user_id == nil
  end
end
