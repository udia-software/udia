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
defmodule Udia.Web.PostController do
  use Udia.Web, :controller

  alias Udia.Logs
  alias Udia.Logs.Category

  plug :load_categories when action in [:new, :create, :edit, :update]

  defp load_categories(conn, _) do
    query =
      Category
      |> Logs.alphabetical
      |> Logs.names_and_ids
    categories = Repo.all query
    assign(conn, :categories, categories)
  end

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, _params, _user) do
    posts = Logs.list_posts
    render conn, "index.html", posts: posts
  end

  def new(conn, _params, user) do
    changeset =
      user
      |> build_assoc(:posts)
      |> Logs.change_post

    render conn, "new.html", changeset: changeset
  end

  def create(conn, %{"post" => post_params}, user) do
    case Logs.create_post(user, post_params) do
      {:ok, post} ->
        conn
        |> put_flash(:info, "Post created successfully.")
        |> redirect(to: post_path(conn, :show, post))
      {:error, changeset} ->
        render conn, "new.html", changeset: changeset
    end
  end

  def show(conn, %{"id" => id}, _user) do
    post = Logs.get_post!(id)
    render conn, "show.html", post: post
  end

  def edit(conn, %{"id" => id}, _user) do
    post = Logs.get_post!(id)
    changeset = Logs.change_post(post)
    render conn, "edit.html", post: post, changeset: changeset
  end

  def update(conn, %{"id" => id, "post" => post_params}, _user) do
    post = Logs.get_post!(id)

    case Logs.update_post(post, post_params) do
      {:ok, post} ->
        conn
        |> put_flash(:info, "Post updated successfully.")
        |> redirect(to: post_path(conn, :show, post))
      {:error, changeset} ->
        render conn, "edit.html", post: post, changeset: changeset
    end
  end

  def delete(conn, %{"id" => id}, _user) do
    Logs.delete_post!(id)

    conn
    |> put_flash(:info, "Post deleted successfully.")
    |> redirect(to: post_path(conn, :index))
  end
end
