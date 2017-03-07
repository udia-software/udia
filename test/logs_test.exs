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
defmodule Udia.LogsTest do
  use Udia.DataCase

  alias Udia.Logs.{Post, Comment}

  @valid_post_attrs %{title: "some title", content: "some content"}
  @valid_comment_attrs %{body: "test comment"}
  @invalid_post_attrs %{title: nil, content: nil}
  @invalid_attrs %{}

  setup do
    user = insert_user(username: "seto")
    post = insert_post(user, @valid_post_attrs)
    comment = insert_comment(%{body: "test comment"})
    {:ok, user: user, post: post, comment: comment}
  end

  test "list_posts/1 return all posts", %{post: post} do
    post = post |> Repo.preload(:user)
    assert Logs.list_posts() == [post]
  end

  test "get_post/1 return post with a given id", %{post: post} do
    post = post |> Repo.preload(:user)
    assert Logs.get_post!(post.id) == post
  end

  test "create_post/2 with a valid data", %{user: user} do
    assert {:ok, _post} = Logs.create_post(user, @valid_post_attrs)
  end

  test "update_post/2 with a valid data", %{post: post} do
    assert {:ok, _post} = Logs.update_post(post, %{title: "hello", content: "hi"})
  end

  test "update_post/2 with an invalid data", %{post: post} do
    assert {:error, %Ecto.Changeset{}} = Logs.update_post(post, @invalid_post_attrs)
  end

  test "create_post/2 with an invalid data", %{user: user} do
    assert {:error, %Ecto.Changeset{}} = Logs.create_post(user, @invalid_attrs)
  end

  test "delete_post/1 deletes the post", %{post: post} do
    post = Logs.delete_post!(post.id)
    assert_raise Ecto.NoResultsError, fn -> Logs.get_post!(post.id) end
  end

  test "change_post/1 returns a post changeset" do
    assert %Ecto.Changeset{} = Logs.change_post(%Post{})
  end

  test "get_comment/1 return comment with a given id", %{comment: comment} do
    assert Logs.get_comment!(comment.id) == comment
  end

  test "create_comment/1 with a valid data" do
    assert {:ok, _comment} = Logs.create_comment(@valid_comment_attrs)
  end

  test "update_comment/2 with a valid data", %{comment: comment} do
    assert {:ok, _comment} = Logs.update_comment(comment, %{body: "hello"})
  end

  test "delete_comment/1 deletes the comment", %{comment: comment} do
    comment = Logs.delete_comment!(comment)
    assert_raise Ecto.NoResultsError, fn -> Logs.get_comment!(comment.id) end
  end

  test "change_comment/1 return a comment changeset" do
    assert %Ecto.Changeset{} = Logs.change_comment(%Comment{})
  end
end
