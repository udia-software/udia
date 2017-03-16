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
  alias Udia.Web.CommentView
  alias Udia.Web.Presence
  alias Udia.Auths.User
  alias Udia.Logs.Post
  alias Udia.Logs.Comment
  alias Udia.Reactions
  alias Udia.Reactions.Vote
  @endpoint Udia.Web.Endpoint


  def join("post:" <> post_id, params, socket) do
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
    [point] = Reactions.get_point(post_id)
    vote = Reactions.get_vote(socket.assigns.user_id, post_id)
    value =
      if is_nil(vote) do
        0
      else
        vote = Reactions.get_vote(socket.assigns.user_id, post_id)
        vote.vote
      end

    resp = %{comments: Phoenix.View.render_many(comments, CommentView, "comment.json"),
             point: point,
             value: value,
             id: socket.assigns.user_id}
    {:ok, resp, assign(socket, :post_id, post_id)}
  end

  def handle_info(:after_join, socket) do
    user = Repo.get(User, socket.assigns.user_id)
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

  def handle_in("new_comment", params, socket) do
    changeset =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:comments, post_id: socket.assigns.post_id)
      |> Udia.Logs.comment_changeset(params)

    case Repo.insert(changeset) do
      {:ok, comment} ->
        broadcast_comment(socket, "new_comment", comment)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end

  def handle_in("edit_comment", %{"id" => id, "body" => body}, socket) do
    changeset =
      Comment
      |> Repo.get(id)
      |> Udia.Logs.comment_changeset(%{body: body})

    case Repo.update(changeset) do
      {:ok, comment} ->
        broadcast_comment(socket, "edit_comment", comment)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset.errors}}, socket}
    end
  end

  def handle_in("reply_comment", %{"id" => id, "body" => body}, socket) do
    changeset =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:comments, post_id: socket.assigns.post_id)
      |> Udia.Logs.comment_changeset(%{body: body})

    case Repo.insert(changeset) do
      {:ok, comment} ->
        comment =
          comment
          |> Repo.preload(:parent_comment)
          |> Ecto.Changeset.change(%{parent_comment_id: id})
          |> Repo.update!

        broadcast_comment(socket, "reply_comment", comment)
        {:noreply, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset.errors}}, socket}
    end
  end

  def handle_in("delete_comment", %{"id" => id}, socket) do
    comment =
      Comment
      |> Repo.get(id)
      |> Repo.preload(:parent_comment)
      |> Ecto.Changeset.change(%{body: nil, user_id: nil})

    case Repo.update(comment) do
      {:ok, comment} ->
        broadcast_comment(socket, "delete_comment", comment)
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset.errors}}, socket}
    end
  end

  def handle_in("up_vote", _params, socket) do
    vote = Reactions.get_vote(socket.assigns.user_id, socket.assigns.post_id)
    vote_assoc =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:vote, post_id: socket.assigns.post_id)

    if is_nil(vote) do
      insert_and_broadcast(vote_assoc, %{vote: 1}, "up_vote", socket)
    else
      vote = Reactions.get_vote(socket.assigns.user_id, socket.assigns.post_id)
      if vote.vote == 1 do
        update_and_broadcast(vote, %{vote: 0}, "up_vote", socket)
      else
        update_and_broadcast(vote, %{vote: 1}, "up_vote", socket)
      end
    end
  end

  def handle_in("down_vote", _params, socket) do
    vote = Reactions.get_vote(socket.assigns.user_id, socket.assigns.post_id)
    vote_assoc =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:vote, post_id: socket.assigns.post_id)

    if is_nil(vote) do
      insert_and_broadcast(vote_assoc, %{vote: -1}, "down_vote", socket)
    else
      vote = Reactions.get_vote(socket.assigns.user_id, socket.assigns.post_id)
      if vote.vote == -1 do
        update_and_broadcast(vote, %{vote: 0}, "down_vote", socket)
      else
        update_and_broadcast(vote, %{vote: -1}, "down_vote", socket)
      end
    end
  end

  defp insert_and_broadcast(%Vote{} = vote, attrs, event, socket) do
    vote
    |> Reactions.vote_changeset(attrs)
    |> Repo.insert
    |> handle_broadcast(event, socket)
  end

  defp update_and_broadcast(%Vote{} = vote, attrs, event, socket) do
    vote
    |> Reactions.vote_changeset(attrs)
    |> Repo.update
    |> handle_broadcast(event, socket)
  end

  defp handle_broadcast({:error, changeset}, _event, socket), do: {:reply, {:error, %{errors: changeset.errors}}, socket}
  defp handle_broadcast({:ok, vote}, event, socket) do
    [point] = Reactions.get_point(socket.assigns.post_id)
    broadcast! socket, event, %{point: point, value: vote.vote, id: socket.assigns.user_id}
    @endpoint.broadcast! "category:lobby", event, %{point: point, value: vote.vote, id: socket.assigns.user_id}
    {:noreply, socket}
  end

  defp broadcast_comment(socket, event, comment) do
    comment = Repo.preload(comment, :user)
    rendered_comment = Phoenix.View.render(CommentView, "comment.json", %{
      comment: comment
    })
    broadcast! socket, event, %{rendered_comment: rendered_comment, id: socket.assigns.user_id}
  end
end
