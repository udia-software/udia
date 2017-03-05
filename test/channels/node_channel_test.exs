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
defmodule Udia.NodeChannelTest do
  use Udia.Web.ChannelCase

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
