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
defmodule UdiaWeb.UserSocket do
  use Phoenix.Socket
  import Guardian.Phoenix.Socket

  ## Channels
  channel "post:*", UdiaWeb.PostChannel

  if Application.get_env(:udia, :environment) == :dev do
    transport :websocket, Phoenix.Transports.WebSocket, timeout: 60_000
  else
    transport :websocket, Phoenix.Transports.WebSocket, timeout: 45_000,
      check_origin: [
        Application.get_env(:udia, :udia_client)[:client_origin_url],
      ]
  end

  def connect(%{"guardian_token" => jwt}, socket) do
    case sign_in(socket, jwt) do
      {:ok, authed_socket, guardian_params} ->
        {:ok, assign(authed_socket, :user_id, guardian_params.resource.username)}
      _ ->
        {:ok, assign(socket, :user_id, "")}
    end
  end

  def connect(_params, socket) do
    {:ok, assign(socket, :user_id, "")}
  end

  def id(socket) do
    # unauthenticated will have empty string user_id, no guardian_default_claims
    "users_socket:#{socket.assigns.user_id}"
  end
end
