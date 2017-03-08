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
  alias Udia.Reactions.{Vote, Point}
  alias Udia.Logs.Post
  alias Udia.Auths.User
  alias Ecto.Multi

  def get_vote!(id), do: Repo.get!(Vote, id)

  def create_vote(%User{} = user, attrs) do
    user
    |> Ecto.build_assoc(:vote)
    |> vote_changeset(attrs)
  end

  def vote_changeset(%Vote{} = vote, attrs) do
    vote
    |> cast(attrs, [:up_vote, :down_vote])
    |> validate_required([:up_vote, :down_vote])
  end

  def get_point!(id), do: Repo.get!(Point, id)

  def create_point(%Post{} = post, attrs) do
    post
    |> Ecto.build_assoc(:point)
    |> point_changeset(attrs)
  end

  def point_changeset(%Point{} = point, attrs) do
    point
    |> cast(attrs, [:value])
    |> validate_required([:value])
  end

  def up_vote(%User{} = user, %Post{} = post, vote_params, point_params) do
    Multi.new
    |> Multi.insert(:vote, create_vote(user, vote_params))
    |> Multi.insert(:point, create_point(post, point_params))
  end
end
