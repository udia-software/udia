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
defmodule Udia.Web.PostChannel do
  use Udia.Web, :channel
  alias Udia.Web.{CommentView, Presence}
  alias Udia.Auths.User
  alias Udia.Logs.Post
  alias Udia.Reactions
  require Logger


  def join("posts:" <> post_id, params, socket) do
    send self(), :after_join
    last_seen_id = params["last_seen_id"] || 0
    post_id = String.to_integer(post_id)
    post = Repo.get!(Post, post_id)

    comments = Repo.all(
        from a in assoc(post, :comments),
            where: a.id > ^last_seen_id,
            order_by: [asc: a.id],
            limit: 200,
            preload: [:user]
    )
    resp = %{comments: Phoenix.View.render_many(comments, CommentView, "comment.json")}
    {:ok, resp, assign(socket, :post_id, post_id)}
  end

  def handle_in("up_vote", _params, socket) do
    Logger.info "A user just up vote a post"
    post =
      Post
      |> Repo.get(socket.assigns.post_id)
      |> Repo.preload(:point)

    user =
      User
      |> Repo.get(socket.assigns.user_id)
      |> Repo.preload(:vote)

    unless post.point do
      vote_params = %{up_vote: true, down_vote: false}
      point_params = %{value: 1}

      case Repo.transaction(Reactions.up_vote(user, post, vote_params, point_params)) do
        {:ok, %{vote: new_vote, point: new_point}} ->
          broadcast! socket, "up_vote", %{value: new_point.value, up_vote: new_vote.up_vote}
          {:reply, :ok, socket}
        {:error, failed_operation, _failed_value, _changes_so_far} ->
          {:reply, {:error, %{errors: failed_operation}}}
      end
    else

      value = post.point.value

      unless user.vote do
        vote_params = %{up_vote: true, down_vote: false}
        point_params = %{value: (value + 1)}

        case Repo.transaction(Reactions.up_vote(user, post, vote_params, point_params)) do
          {:ok, %{vote: new_vote, point: new_point}} ->
            broadcast! socket, "up_vote", %{value: new_point.value, up_vote: new_vote.up_vote}
            {:noreply, socket}
          {:error, failed_operation, _failed_value, _changes_so_far} ->
            {:reply, {:error, %{errors: failed_operation}}}
        end
       else

        if user.vote.up_vote do
          point = Repo.get(Udia.Reactions.Point, post.point.id)
          changeset = Reactions.point_changeset(point, %{value: (value - 1)})

          case Repo.update(changeset) do
            {:ok, new_point} ->
              broadcast! socket, "up_vote", %{value: new_point.value, up_vote: user.vote.up_vote}
              {:reply, :ok, socket}
            {:error, changeset} ->
              {:reply, {:error, %{errors: changeset.errors}}, socket}
          end
        else
          vote_params = %{up_vote: true, down_vote: false}
          point_params = %{value: (value + 1)}

          case Repo.transaction(Reactions.up_vote(user, post, vote_params, point_params)) do
            {:ok, %{vote: new_vote, point: new_point}} ->
              broadcast! socket, "up_vote", %{value: new_point.value, up_vote: new_vote.up_vote}
              {:noreply, socket}
            {:error, failed_operation, _failed_value, _changes_so_far} ->
              {:reply, {:error, %{errors: failed_operation}}}
          end
        end
      end
    end
  end

  def handle_in("down_vote", _params, socket) do
    Logger.info "A user just down vote a post"
    {:noreply, socket}
  end

  def handle_in(event, params, socket) do
    user = Repo.get(Udia.Auths.User, socket.assigns.user_id)
    handle_in(event, params, user, socket)
  end

  def handle_in("new_comment", params, user, socket) do
    changeset = user
    |> build_assoc(:comments, post_id: socket.assigns.post_id)
    |> Udia.Logs.comment_changeset(params)

    case Repo.insert(changeset) do
      {:ok, comment} ->
        broadcast_comment(socket, comment)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end

  def handle_info(:after_join, socket) do
    user = Repo.get(Udia.Auths.User, socket.assigns.user_id)
    push socket, "presence_state", Presence.list(socket)
    if socket.assigns.user_id > 0 do
      {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{
        username: user.username,
        online_at: :os.system_time(:milli_seconds)
      })
    else
      {:ok, _} = Presence.track(socket, -1, %{
        username: "anon",
        online_at: 0
      })
    end
    {:noreply, socket}
  end

  defp broadcast_comment(socket, comment) do
    comment = Repo.preload(comment, :user)
    rendered_comment = Phoenix.View.render(CommentView, "comment.json", %{
      comment: comment
    })
    broadcast! socket, "new_comment", rendered_comment
  end
end
