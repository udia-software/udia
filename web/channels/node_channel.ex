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
defmodule Udia.NodeChannel do
  use Udia.Web, :channel
  alias Udia.CommentView
  
  def join("nodes:" <> node_id, params, socket) do
    last_seen_id = params["last_seen_id"] || 0
    node_id = String.to_integer(node_id)
    node = Repo.get!(Udia.Node, node_id)

    comments = Repo.all(
        from a in assoc(node, :comments),
            where: a.id > ^last_seen_id,
            order_by: [asc: a.id],
            limit: 200,
            preload: [:user]
    )
    resp = %{comments: Phoenix.View.render_many(comments, CommentView, "comment.json")}
    {:ok, resp, assign(socket, :node_id, node_id)}
  end

  def handle_in(event, params, socket) do
    user = Repo.get(Udia.User, socket.assigns.user_id)
    handle_in(event, params, user, socket)
  end

  def handle_in("new_comment", params, user, socket) do
    changeset = user
    |> build_assoc(:comments, node_id: socket.assigns.node_id)
    |> Udia.Comment.changeset(params)

    case Repo.insert(changeset) do
      {:ok, comment} ->
        broadcast_comment(socket, comment)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end

  defp broadcast_comment(socket, comment) do
    comment = Repo.preload(comment, :user)
    rendered_comment = Phoenix.View.render(CommentView, "comment.json", %{
      comment: comment
    })
    broadcast! socket, "new_comment", rendered_comment
  end
end
