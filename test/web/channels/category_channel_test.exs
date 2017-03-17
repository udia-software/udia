defmodule Udia.Web.CategoryChannelTest do
  use Udia.Web.ChannelCase

  setup do
    user = insert_user(username: "casper")
    post = insert_post(user, %{content: "content", title: "title"})
    token = Phoenix.Token.sign(@endpoint, "user socket", user.id)
    {:ok, socket} = connect(UserSocket, %{"token" => token})

    {:ok, socket: socket, user: user, post: post}
  end

  test "Upvote categoryChannel", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "category:lobby", %{"ids" => [post.id]})
    push socket, "up_vote", %{"id" => "#{post.id}"}
    assert_broadcast "up_vote", %{}
  end

  test "Downvote categoryChannel", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "category:lobby", %{"ids" => [post.id]})
    push socket, "down_vote", %{"id" => "#{post.id}"}
    assert_broadcast "down_vote", %{}
  end

  test "response when joining successfully", %{socket: socket, post: post} do
    {:ok, resp, _} = subscribe_and_join(socket, "category:lobby", %{"ids" => [post.id]})
    assert resp == [%{point: nil, value: 0, id: post.id}]
  end
end
