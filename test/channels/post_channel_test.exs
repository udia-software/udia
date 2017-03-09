###############################################################################
# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
# The License is based on the Mozilla Public License Version 1.1, but
# Sections 14 and 15 have been added to cover use of software over a computer
# network and provide for limited attribution for the Original Developer.
# In addition, Exhibit A has been modified to be consistent with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is UDIA.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is Udia Software Incorporated.
#
# All portions of the code written by UDIA are Copyright (c) 2016-2017
# Udia Software Incorporated. All Rights Reserved.
###############################################################################
defmodule Udia.PostChannelTest do
  use Udia.Web.ChannelCase

  setup do
    user = insert_user(username: "seto")
    post = insert_post(user, %{content: "some content", title: "some title"})
    token = Phoenix.Token.sign(@endpoint, "user socket", user.id)
    {:ok, socket} = connect(UserSocket, %{"token" => token})

    {:ok, socket: socket, user: user, post: post}
  end

  test "join channel", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})

    assert socket.assigns.post_id == post.id
  end

  test "insert new comment", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    ref = push socket, "new_comment", %{"body" => "some content"}
    assert_reply ref, :ok, %{}
    assert_broadcast "new_comment", %{}
  end

  test "A user should be able to vote on a post +1", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    push socket, "up_vote", %{}
    assert_broadcast "up_vote", %{point: 1, value: 1}
  end

  test "A user should be able to vote on a post -1", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    push socket, "down_vote", %{}
    assert_broadcast "down_vote", %{point: -1, value: -1}
  end

  test "A user has already vote +1 and try to vote again", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    push socket, "up_vote", %{}
    assert_broadcast "up_vote", %{point: 1, value: 1}
    push socket, "up_vote", %{}
    assert_broadcast "up_vote", %{point: 0, value: 0}
  end

  test "A user has already vote -1 and try to vote again", %{socket: socket, post: post} do
    {:ok, _, socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    push socket, "down_vote", %{}
    assert_broadcast "down_vote", %{point: -1, value: -1}
    push socket, "down_vote", %{}
    assert_broadcast "down_vote", %{point: 0, value: 0}
  end

  test "Post should display the sum of all votes from users", %{socket: socket, post: post, user: user} do
    vote = insert_vote(user, post, %{vote: 1})
    {:ok, resp, _socket} = subscribe_and_join(socket, "posts:#{post.id}", %{})
    assert resp.point == vote.vote
  end
end
