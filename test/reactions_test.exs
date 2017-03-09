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
defmodule Udia.ReactionsTest do
  use Udia.DataCase
  alias Udia.Reactions.Vote

  setup do
    user = insert_user(username: "seto")
    post = insert_post(user, %{content: "some content", title: "some title"})
    {:ok, user: user, post: post}
  end

  test "vote_changeset/2 return a vote changeset" do
    assert %Ecto.Changeset{} = Reactions.vote_changeset(%Vote{}, %{vote: 1})
  end

  test "get_vote/2 return only vote assoc with user and post", %{user: user, post: post} do
    vote =
      user
      |> build_assoc(:vote, post_id: post.id)
      |> Reactions.vote_changeset(%{vote: -1})
      |> Repo.insert!

    assert vote == Reactions.get_vote(user.id, post.id)
  end

  test "get_point/1 return the point for post", %{user: user, post: post} do
    vote =
      user
      |> build_assoc(:vote, post_id: post.id)
      |> Reactions.vote_changeset(%{vote: 1})
      |> Repo.insert!

    assert Reactions.get_point(post.id) == [vote.vote]
  end
end
