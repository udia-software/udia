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
defmodule Udia.Web.CommentController do
  use Udia.Web, :controller

  alias Udia.Logs

  def create(conn, %{"comment" => comment_params}) do
    case Logs.create_comment(comment_params) do
      {:ok, comment} ->
        conn
        |> put_flash(:info, "Comment created successfully.")
        |> redirect(to: post_path(conn, :show, comment.node_id))
      {:error, changeset} ->
        conn
        |> put_flash(:info, "Could not create comment.")
        |> redirect(to: post_path(conn, :show, changeset.node))
    end
  end

  def update(conn, %{"id" => id, "comment" => comment_params}) do
    comment = Logs.get_comment!(id)

    case Logs.update_comment(comment, comment_params) do
      {:ok, comment} ->
        conn
        |> put_flash(:info, "Comment updated successfully.")
        |> redirect(to: post_path(conn, :show, comment.node_id))
      {:error, changeset} ->
        conn
        |> put_flash(:info, "Could not update comment")
        |> redirect(to: post_path(conn, :show, changeset.node))
    end
  end

  def delete(conn, %{"id" => id}) do
    comment = Logs.get_comment!(id)

    node_id = comment.node_id
    # Here we use delete! (with a bang) because we expect
    # it to always work (and if it does not, it will raise).
    Logs.delete_comment!(comment)

    conn
    |> put_flash(:info, "Comment deleted successfully.")
    |> redirect(to: post_path(conn, :show, node_id))
  end
end
