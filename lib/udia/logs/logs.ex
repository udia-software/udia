###############################################################################
# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# https://raw.githubpostcontent.com/udia-software/udia/master/LICENSE.
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
defmodule Udia.Logs do
  @moduledoc """
  The boundary for the Logs system.
  """

  import Ecto.{Query, Changeset}, warn: false
  alias Udia.Logs.{Post, Comment}
  alias Udia.Repo

  @doc """
  Return the list of posts.

  ## Examples

      iex> list_posts()
      [%Post{}, ...]

  """
  def list_posts do
    Post
    |> Repo.all()
    |> Repo.preload(:user)
  end

  @doc """
  Gets a single post.

  Raises `Ecto.NoResultsError` if the Post does not exist.

  ## Examples

      iex> get_post!(123)
      %Post{}

      iex> get_post!(456)
      ** (Ecto.NoResultsError)

  """
  def get_post!(id), do: Repo.get!(Post, id) |> Repo.preload(:user)

  @doc """
  Creates a post.

  ## Examples

      iex> create_post(post, %{field: value})
      {:ok, %Post{}}

      iex> create_post(post, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_post(user, attrs \\ %{}) do
    user
    |> Ecto.build_assoc(:posts)
    |> post_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a post.

  ## Examples

      iex> update_post(post, %{field: new_value})
      {:ok, %Post{}}

      iex> update_post(post, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_post(%Post{} = post, attrs) do
    post
    |> post_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Post.

  ## Examples

      iex> delete_post(post)
      {:ok, %Post{}}

      iex> delete_post(post)
      {:error, %Ecto.Changeset{}}

  """
  def delete_post!(id) do
    get_post!(id)
    |> Repo.delete!
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking post changes.

  ## Examples

      iex> change_post(post)
      %Ecto.Changeset{source: %Post{}}

  """
  def change_post(%Post{} = post) do
    post_changeset(post, %{})
  end

  defp post_changeset(%Post{} = post, attrs) do
    post
    |> cast(attrs, [:title, :content])
    |> validate_required([:title, :content])
  end

  def get_comment!(id), do: Repo.get!(Comment, id)

  def create_comment(attrs \\ %{}) do
    %Comment{}
    |> comment_changeset(attrs)
    |> Repo.insert()
  end

  def update_comment(%Comment{} = comment, attrs) do
    comment
    |> comment_changeset(attrs)
    |> Repo.update()
  end

  def delete_comment!(%Comment{} = comment) do
    Repo.delete!(comment)
  end

  def change_comment(%Comment{} = comment) do
    comment_changeset(comment, %{})
  end

  def comment_changeset(%Comment{} = comment, attrs) do
    comment
    |> cast(attrs, [:body])
    |> validate_required([:body])
  end

end
