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
defmodule Udia.Reactions do
  @moduledoc """
  The boundary for the reations system.
  """

  import Ecto.{Query, Changeset}, warn: false
  alias Udia.Repo
  alias Udia.Reactions.Vote
  alias Udia.Auths.User

  def get_vote(user_id, post_id) do
    User
    |> join(:inner, [u], p in assoc(u, :posts))
    |> join(:inner, [u, p], v in assoc(p, :vote))
    |> where([u, p, v], v.user_id == ^user_id and v.post_id == ^post_id)
    |> select([u, p, v], v)
    |> Repo.one
  end

  def create_vote(%User{} = user, attrs) do
    user
    |> Ecto.build_assoc(:vote)
    |> vote_changeset(attrs)
  end

  def vote_changeset(%Vote{} = vote, attrs) do
    vote
    |> cast(attrs, [:vote])
    |> validate_required([:vote])
  end

  def get_point(post_id) do
    User
    |> join(:inner, [u], p in assoc(u, :posts))
    |> join(:inner, [u, p], v in assoc(p, :vote))
    |> where([u, p], p.id == ^post_id)
    |> select([u, p, v], sum(v.vote))
    |> Repo.all
  end

end
