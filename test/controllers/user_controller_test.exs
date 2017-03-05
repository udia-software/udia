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
defmodule Udia.UserControllerTest do
  use Udia.Web.ConnCase

  @request_params %{
    "user" => %{username: "Seto", password: "090909"}
  }

  setup do
    conn = build_conn()
    {:ok, conn: conn}
  end

  test "create an user", %{conn: conn} do
    conn = conn |> post("/users", @request_params)
    user = conn.assigns.current_user

    assert conn.status == 302
    assert redirected_to(conn) == user_path(conn, :index)
    assert user.username == "Seto"
  end

  test "list all users", %{conn: conn} do
    conn = conn
           |> post("/users", @request_params)
           |> get("/users")

    assert html_response(conn, 200) =~ "Listing users"
  end

  test "render user form new", %{conn: conn} do
    conn = get conn, user_path(conn, :new)
    assert html_response(conn, 200) =~ "New User"
  end

  test "show an user", %{conn: conn} do
    conn = conn |> post(user_path(conn, :create), @request_params)
    user_id = conn.assigns.current_user.id
    conn = get conn, user_path(conn, :show, user_id)
    assert html_response(conn, 200) =~ "Showing user"
  end
end
