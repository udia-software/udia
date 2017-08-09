defmodule UdiaWeb.PostChannelTest do
  use UdiaWeb.ChannelCase
  alias Udia.Records
  alias UdiaWeb.UserSocket
  alias UdiaWeb.PostChannel

  @user_params %{username: "udia", password: "hunter2"}
  @post_params %{content: "Popular Test Post", title: "This Post Dawg", type: "text"}

  setup do
    user = insert_user(@user_params)
    { :ok, jwt, _full_claims } = Guardian.encode_and_sign(user, :access)

    {:ok, socket} = connect(UserSocket, %{"guardian_token" => jwt})
    {:ok, user: user, socket: socket}
  end

  test "joining a post channel creates a presence", %{user: user, socket: socket} do
    post = insert_post(user, @post_params)

    assert Records.list_perceptions() == []

    socket = subscribe_and_join!(socket, PostChannel, "post:#{post.id}")

    assert (length Records.list_perceptions()) == 1
    [head|_tail] = Records.list_perceptions()
    assert head.post_id == post.id
    assert head.user_id == user.id
    assert head.start_time
    assert head.end_time == nil
    assert head.counter == 1

    val = close(socket)
    IO.inspect(val)

    assert (length Records.list_perceptions()) == 1
    [head|_tail] = Records.list_perceptions()
    assert head.post_id == post.id
    assert head.user_id == user.id
    assert head.start_time
    assert head.end_time
    assert head.counter == 0
  end
end