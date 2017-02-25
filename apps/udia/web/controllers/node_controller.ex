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
defmodule Udia.NodeController do
  use Udia.Web, :controller

  alias Udia.Node

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, _params, _user) do
    nodes = Repo.all(Node)
    render(conn, "index.html", nodes: nodes)
  end

  def new(conn, _params, user) do
    changeset =
      user
      |> build_assoc(:nodes)
      |> Node.changeset()
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"node" => node_params}, user) do
    changeset =
      user
      |> build_assoc(:nodes)
      |> Node.changeset(node_params)

    case Repo.insert(changeset) do
      {:ok, _node} ->
        conn
        |> put_flash(:info, "Node created successfully.")
        |> redirect(to: node_path(conn, :index))
      {:error, changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}, _user) do
    node = Repo.get!(Node, id)
    render(conn, "show.html", node: node)
  end

  def edit(conn, %{"id" => id}, user) do
    node = Repo.get(user_nodes(user), id)
    if !node do
      conn
      |> put_flash(:info, "You cannot edit this node.")
      |> redirect(to: node_path(conn, :show, id))
    end
    changeset = Node.changeset(node)
    render(conn, "edit.html", node: node, changeset: changeset)
  end

  def update(conn, %{"id" => id, "node" => node_params}, user) do
    node = Repo.get(user_nodes(user), id)
    if !node do
      conn
      |> put_flash(:info, "You cannot update this node.")
      |> redirect(to: node_path(conn, :index))
    end

    changeset = Node.changeset(node, node_params)

    case Repo.update(changeset) do
      {:ok, node} ->
        conn
        |> put_flash(:info, "Node updated successfully.")
        |> redirect(to: node_path(conn, :show, node))
      {:error, changeset} ->
        render(conn, "edit.html", node: node, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}, user) do
    node = Repo.get(user_nodes(user), id)
    if !node do
      conn
      |> put_flash(:info, "You cannot delete this node.")
      |> redirect(to: node_path(conn, :index))
    end

    # Here we use delete! (with a bang) because we expect
    # it to always work (and if it does not, it will raise).
    Repo.delete!(node)

    conn
    |> put_flash(:info, "Node deleted successfully.")
    |> redirect(to: node_path(conn, :index))
  end

  defp user_nodes(user) do
    assoc(user, :nodes)
  end
end
