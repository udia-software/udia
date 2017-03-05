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
defmodule Udia.Web.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "nodes:*", Udia.Web.NodeChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket, timeout: 45_000
  # transport :longpoll, Phoenix.Transports.LongPoll

  @max_age 2 * 7 * 24 * 60 * 60
  def connect(%{"token" => token}, socket) do
    case Phoenix.Token.verify(socket, "user socket", token, max_sage: @max_age) do
      {:ok, user_id} ->
        # If user id exists, assign to user id. This will be flushed out on login
        {:ok, assign(socket, :user_id, user_id)}
      {:error, _reason} ->
        # If the user doesn't exist, assign the anonymous user
        {:ok, assign(socket, :user_id, nil)}
    end
  end

  def connect(_params, socket) do
    {:ok, assign(socket, :user_id, nil)}
  end

  def id(socket), do: "users_socket:#{socket.assigns.user_id}"
end
