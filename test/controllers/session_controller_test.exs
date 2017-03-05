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
defmodule Udia.SessionControllerTest do
  use Udia.Web.ConnCase

  @session_opts Plug.Session.init [
    store: :cookie,
    key: "_test",
    encryption_salt: "abcdef",
    signing_salt: "abcdef"
  ]

  setup do
    user = insert_user(username: "seto", password: "090909")
    conn = build_conn()
    |> assign(:current_user, user)
    |> Plug.Session.call(@session_opts)
    |> Plug.Conn.fetch_session

    {:ok, conn: conn, user: user}
  end

  test "create a new session", %{conn: conn} do
    session_params = %{
      "session" => %{"username" => "seto", "password" => "090909"}
    }

    conn = post conn, session_path(conn, :create), session_params

    assert get_flash(conn, :info) == "Welcome back, seto."
    assert redirected_to(conn) == node_path(conn, :index)
    assert conn.status == 302
  end

  # test "delete a session", %{conn: conn} do
  #   conn = delete conn, "/sessions"
  #   assert conn.status == 404
  # end

  test "render new session template", %{conn: conn} do
    conn = get conn, session_path(conn, :new)
    assert html_response(conn, 200) =~ "Login"
  end
end
