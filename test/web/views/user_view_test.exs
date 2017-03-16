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
defmodule Udia.UserViewTest do
  use Udia.Web.ConnCase
  import Phoenix.View

  test "renders index.html", %{conn: conn} do
    users = [%Udia.Auths.User{id: 1, username: "seto"},
            %Udia.Auths.User{id: 2, username: "casper"}]

    content = render_to_string(Udia.Web.UserView, "index.html", conn: conn, users: users)
    assert String.contains?(content, "Listing users")
    for user <- users do
      assert String.contains?(content, user.username)
    end
  end

  test "renders new.html", %{conn: conn} do
    changeset = Auths.user_changeset(%Udia.Auths.User{}, %{})
    content = render_to_string(Udia.Web.UserView, "new.html", conn: conn, changeset: changeset)
    assert String.contains?(content, "New User")
  end
end
