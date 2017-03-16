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
defmodule Udia.PostControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Logs.Post

  test "requires user authentication on all actions except index and show", %{conn: conn} do
    Enum.each([
      get(conn, post_path(conn, :new)),
      get(conn, post_path(conn, :edit, "123")),
      put(conn, post_path(conn, :update, "123", %{})),
      post(conn, post_path(conn, :create, %{})),
      delete(conn, post_path(conn, :delete, "123")),
    ], fn conn ->
      assert html_response(conn, 302)
      assert conn.halted
     end)
  end

  setup %{conn: conn} = config do
    if username = config[:login_as] do
      user = insert_user(username: username)
      conn = assign(build_conn(), :current_user, user)
      {:ok, conn: conn, user: user}
    else
      :ok
    end
  end

  @valid_attrs %{content: "some content", title: "some content"}
  @invalid_attrs %{}
  @tag login_as: "samwell"
  test "lists all entries on index", %{conn: conn} do
    conn = get conn, post_path(conn, :index)
    assert html_response(conn, 200) =~ "UDIA"
  end

  @tag login_as: "samwell"
  test "renders form for new resources", %{conn: conn} do
    conn = get conn, post_path(conn, :new)
    assert html_response(conn, 200) =~ "New post"
  end

  @tag login_as: "samwell"
  test "creates resource and redirects when data is valid", %{conn: conn} do
    conn = post conn, post_path(conn, :create), post: @valid_attrs
    assert Repo.get_by(Post, @valid_attrs)
    post = Repo.get_by(Post, @valid_attrs)
    assert redirected_to(conn) == post_path(conn, :show, post)
  end

  @tag login_as: "samwell"
  test "does not create resource and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, post_path(conn, :create), post: @invalid_attrs
    assert html_response(conn, 200) =~ "New post"
  end

  @tag login_as: "samwell"
  test "shows chosen resource", %{conn: conn, user: user} do
    post = insert_post(user, @valid_attrs)
    conn = get conn, post_path(conn, :show, post)
    assert html_response(conn, 200) =~ "some content"
  end

  @tag login_as: "samwell"
  test "renders page not found when id is nonexistent", %{conn: conn} do
    assert_error_sent 404, fn ->
      get conn, post_path(conn, :show, 1984)
    end
  end

  @tag login_as: "samwell"
  test "renders 400 when id is invalid", %{conn: conn} do
    assert_error_sent 400, fn ->
      get conn, post_path(conn, :show, "foo")
    end
  end


  @tag login_as: "samwell"
  test "renders form for editing chosen resource", %{conn: conn, user: user} do
    post = insert_post(user, @valid_attrs)
    conn = get conn, post_path(conn, :edit, post)
    assert html_response(conn, 200) =~ "Edit post"
  end

  @tag login_as: "samwell"
  test "updates chosen resource and redirects when data is valid", %{conn: conn, user: user} do
    post = insert_post(user, @valid_attrs)
    conn = put conn, post_path(conn, :update, post), post: @valid_attrs
    assert redirected_to(conn) == post_path(conn, :show, post)
    assert Repo.get_by(Post, @valid_attrs)
  end

  @tag login_as: "samwell"
  test "does not update chosen resource and renders errors when data is invalid", %{conn: conn, user: user} do
    post = insert_post(user, @valid_attrs)
    conn = put conn, post_path(conn, :update, post), post: @invalid_attrs
    assert redirected_to(conn) == post_path(conn, :show, post)
    assert Repo.get_by(Post, @valid_attrs)
  end

  @tag login_as: "samwell"
  test "deletes chosen resource", %{conn: conn, user: user} do
    post = insert_post(user, @valid_attrs)
    conn = delete conn, post_path(conn, :delete, post)
    assert redirected_to(conn) == post_path(conn, :index)
    refute Repo.get(Post, post.id)
  end
end
