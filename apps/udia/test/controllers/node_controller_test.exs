defmodule Udia.NodeControllerTest do
  use Udia.ConnCase

  alias Udia.Node

  test "requires user authentication on all actions", %{conn: conn} do
    Enum.each([
      get(conn, node_path(conn, :new)),
      get(conn, node_path(conn, :index)),
      get(conn, node_path(conn, :show, "123")),
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
  test "shows chosen resource", %{conn: conn} do
    node = Repo.insert! %Node{}
    conn = get conn, node_path(conn, :show, node)
    assert html_response(conn, 200) =~ "Show node"
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
