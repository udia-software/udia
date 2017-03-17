defmodule Udia.Web.CategoryChannel do
  use Udia.Web, :channel
  alias Udia.Reactions
  alias Udia.Reactions.Vote
  alias Udia.Repo
  alias Udia.Auths.User
  @endpoint Udia.Web.Endpoint

  def join("category:lobby", %{"ids" => ids}, socket) do

    resp =
      for id <- ids do

        [point] = Reactions.get_point(id)
        vote = Reactions.get_vote(socket.assigns.user_id, id)
        value =
        if is_nil(vote) do
          0
        else
          vote = Reactions.get_vote(socket.assigns.user_id, id)
          vote.vote
        end

        %{point: point, value: value, id: id}
      end

    {:ok, resp, socket}
  end

  def handle_in("up_vote", %{"id" => post_id}, socket) do
    post_id = String.to_integer(post_id)
    vote = Reactions.get_vote(socket.assigns.user_id, post_id)
    vote_assoc =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:vote, post_id: post_id)

    if is_nil(vote) do
      insert_and_broadcast(vote_assoc, %{vote: 1}, "up_vote", post_id, socket)
    else
      vote = Reactions.get_vote(socket.assigns.user_id, post_id)
      if vote.vote == 1 do
        update_and_broadcast(vote, %{vote: 0}, "up_vote", post_id, socket)
      else
        update_and_broadcast(vote, %{vote: 1}, "up_vote", post_id, socket)
      end
    end
  end

  def handle_in("down_vote", %{"id" => post_id}, socket) do
    post_id = String.to_integer(post_id)
    vote = Reactions.get_vote(socket.assigns.user_id, post_id)
    vote_assoc =
      User
      |> Repo.get(socket.assigns.user_id)
      |> build_assoc(:vote, post_id: post_id)

    if is_nil(vote) do
      insert_and_broadcast(vote_assoc, %{vote: -1}, "down_vote", post_id, socket)
    else
      vote = Reactions.get_vote(socket.assigns.user_id, post_id)
      if vote.vote == -1 do
        update_and_broadcast(vote, %{vote: 0}, "down_vote", post_id, socket)
      else
        update_and_broadcast(vote, %{vote: -1}, "down_vote", post_id, socket)
      end
    end
  end

  defp insert_and_broadcast(%Vote{} = vote, attrs, event, post_id, socket) do
    vote
    |> Reactions.vote_changeset(attrs)
    |> Repo.insert
    |> handle_broadcast(event, post_id, socket)
  end

  defp update_and_broadcast(%Vote{} = vote, attrs, event, post_id, socket) do
    vote
    |> Reactions.vote_changeset(attrs)
    |> Repo.update
    |> handle_broadcast(event, post_id, socket)
  end

  defp handle_broadcast({:error, changeset}, _event, _post_id, socket), do: {:reply, {:error, %{errors: changeset.errors}}, socket}
  defp handle_broadcast({:ok, vote}, event, post_id, socket) do
    [point] = Reactions.get_point(post_id)
    broadcast! socket, event, %{point: point, value: vote.vote, id: socket.assigns.user_id, post_id: post_id}
    @endpoint.broadcast! "post:#{post_id}", event, %{point: point, value: vote.vote, id: socket.assigns.user_id}
    {:noreply, socket}
  end
end
