defmodule Udia.NodeChannelTest do
  use Udia.ChannelCase

  setup do
    user = insert_user(username: "seto")
    node = insert_node(user, %{content: "some content", title: "some title"})
    token = Phoenix.Token.sign(@endpoint, "user socket", user.id)
    {:ok, socket} = connect(UserSocket, %{"token" => token})

    {:ok, socket: socket, user: user, node: node}
  end

  test "join channel", %{socket: socket, node: node} do
    {:ok, _, socket} = subscribe_and_join(socket, "nodes:#{node.id}", %{})

    assert socket.assigns.node_id == node.id
  end

  test "insert new comment", %{socket: socket, node: node} do
    {:ok, _, socket} = subscribe_and_join(socket, "nodes:#{node.id}", %{})
    ref = push socket, "new_comment", %{"body" => "some content"}
    assert_reply ref, :ok, %{}
    assert_broadcast "new_comment", %{}
  end
end
