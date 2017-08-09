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
  require Logger

  import Ecto.Query
  alias UdiaWeb.Presence
  alias Udia.Records
  alias Udia.Records.Perception

  def join("post:" <> post_id, _params, socket) do
    send self(), :after_join
    :ok = ChannelWatcher.monitor(:post, self(), {
      __MODULE__, :leave, [post_id, socket.assigns.username]
    })

    username = socket.assigns.username
    # Only care about authenticated users (username set)
    if username != "" do
      Logger.info "JOIN #{post_id} #{username}"
      # Search for perceptions with post_id and username and counter > 0.
      # - If exists (There should only be one!), increment counter by one.
      # - If does not exist, create a new perception with counter = 1.
      user = Udia.Accounts.get_user_by_username!(username)
      perceptions = Perception
      |> where([p], p.post_id == ^post_id and p.user_id == ^user.id and p.counter > 0)
      |> Udia.Repo.all()

      len_perceptions = length perceptions
      if len_perceptions > 0 do
        [head|_tail] = perceptions
        {:ok, perception} = Records.update_perception(head, %{
          counter: head.counter + 1
        })
        Logger.info "JOIN updated perception #{perception.id}"
      else
        {:ok, perception} = Records.create_perception(user, %{
          start_time: DateTime.from_unix!(System.system_time(:seconds)),
          counter: 1,
          post_id: post_id
        })
        Logger.info "JOIN created perception #{perception.id}"
      end
    end
    {:ok, %{}, assign(socket, :post_id, "")}
  end

  def leave(post_id, username) do
    # Only care about authenticated users (username set)
    if username != "" do
      Logger.info "LEAVE #{post_id} #{username}"
      # Search for perceptions with post_id and username and counter > 0.
      # - If exists (There should only be one!), decrement counter by one.

      user = Udia.Accounts.get_user_by_username!(username)
      perceptions = Perception
      |> where([p], p.post_id == ^post_id and p.user_id == ^user.id and p.counter > 0)
      |> Udia.Repo.all()

      len_perceptions = length perceptions
      if len_perceptions > 0 do
        [head|_tail] = perceptions
        {:ok, perception} = Records.update_perception(head, %{
          end_time: DateTime.from_unix!(System.system_time(:seconds)),
          counter: head.counter - 1
        })
        Logger.info "LEAVE updated perception #{perception.id}"
      end
    end
  end

  def handle_info(:after_join, socket) do
    push socket, "presence_state", Presence.list(socket)
    {:ok, _} = Presence.track(socket, socket.assigns.username, %{
      online_at: inspect(System.system_time(:seconds))
    })
    {:noreply, socket}
  end
end
