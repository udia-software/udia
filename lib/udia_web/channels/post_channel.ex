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
defmodule UdiaWeb.PostChannel do
  @moduledoc """
  Module for post websocket & channel functionality
  """
  use UdiaWeb, :channel
  alias UdiaWeb.Presence

  def join("post:" <> post_id, _params, socket) do
    send self(), :after_join
    IO.puts("JOIN #{post_id} #{socket.assigns.user_id}")
    :ok = ChannelWatcher.monitor(:post, self(), {
      __MODULE__, :leave, [post_id, socket.assigns.user_id]
    })
    {:ok, %{}, assign(socket, :post_id, "")}
  end

  def handle_info(:after_join, socket) do
    push socket, "presence_state", Presence.list(socket)
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{
      online_at: inspect(System.system_time(:seconds))
    })
    {:noreply, socket}
  end

  def leave(post_id, user_id) do
    IO.puts("LEAVE #{post_id} #{user_id}")
  end
end
