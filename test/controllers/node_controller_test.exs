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
defmodule Udia.NodeControllerTest do
  use Udia.ConnCase

  alias Udia.Node

  test "requires user authentication on all actions except index and show", %{conn: conn} do
    Enum.each([
      get(conn, node_path(conn, :new)),
      get(conn, node_path(conn, :edit, "123")),
      put(conn, node_path(conn, :update, "123", %{})),
      post(conn, node_path(conn, :create, %{})),
      delete(conn, node_path(conn, :delete, "123")),
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
    conn = get conn, node_path(conn, :index)
    assert html_response(conn, 200) =~ "Listing nodes"
  end

  @tag login_as: "samwell"
  test "renders form for new resources", %{conn: conn} do
    conn = get conn, node_path(conn, :new)
    assert html_response(conn, 200) =~ "New node"
  end

  @tag login_as: "samwell"
  test "creates resource and redirects when data is valid", %{conn: conn} do
    conn = post conn, node_path(conn, :create), node: @valid_attrs
    assert redirected_to(conn) == node_path(conn, :index)
    assert Repo.get_by(Node, @valid_attrs)
  end

  @tag login_as: "samwell"
  test "does not create resource and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, node_path(conn, :create), node: @invalid_attrs
    assert html_response(conn, 200) =~ "New node"
  end

  @tag login_as: "samwell"
  test "shows chosen resource", %{conn: conn, user: user} do
    node = insert_node(user, @valid_attrs)
    conn = get conn, node_path(conn, :show, node)
    assert html_response(conn, 200) =~ "some content"
  end

  @tag login_as: "samwell"
  test "renders page not found when id is nonexistent", %{conn: conn} do
    assert_error_sent 404, fn ->
      get conn, node_path(conn, :show, -1)
    end
  end

  @tag login_as: "samwell"
  test "renders form for editing chosen resource", %{conn: conn, user: user} do
    node = insert_node(user, @valid_attrs)
    conn = get conn, node_path(conn, :edit, node)
    assert html_response(conn, 200) =~ "Edit node"
  end

  @tag login_as: "samwell"
  test "updates chosen resource and redirects when data is valid", %{conn: conn, user: user} do
    node = insert_node(user, @valid_attrs)
    conn = put conn, node_path(conn, :update, node), node: @valid_attrs
    assert redirected_to(conn) == node_path(conn, :show, node)
    assert Repo.get_by(Node, @valid_attrs)
  end

  @tag login_as: "samwell"
  test "does not update chosen resource and renders errors when data is invalid", %{conn: conn, user: user} do
    node = insert_node(user, @valid_attrs)
    conn = put conn, node_path(conn, :update, node), node: @invalid_attrs
    assert redirected_to(conn) == node_path(conn, :show, node)
    assert Repo.get_by(Node, @valid_attrs)
  end

  @tag login_as: "samwell"
  test "deletes chosen resource", %{conn: conn, user: user} do
    node = insert_node(user, @valid_attrs)
    conn = delete conn, node_path(conn, :delete, node)
    assert redirected_to(conn) == node_path(conn, :index)
    refute Repo.get(Node, node.id)
  end
end
