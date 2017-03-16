defmodule Udia.Web.CategoryControllerTest do
  use Udia.Web.ConnCase

  alias Udia.Logs
  alias Udia.Logs.Category

  @create_attrs %{name: "some name"}
  @update_attrs %{name: "some updated name"}
  @invalid_attrs %{}

  setup %{conn: conn} = config do
    if username = config[:login_as] do
      user = insert_user(username: username)
      conn = assign(build_conn(), :current_user, user)
      {:ok, conn: conn, user: user}
    else
      :ok
    end
  end

  def fixture(:category) do
    {:ok, category} = Logs.create_category(@create_attrs)
    category
  end

  @tag login_as: "samwell"
  test "lists all entries on index", %{conn: conn} do
    conn = get conn, category_path(conn, :index)
    assert html_response(conn, 200) =~ "Listing Categories"
  end

  @tag login_as: "samwell"
  test "renders form for new categories", %{conn: conn} do
    conn = get conn, category_path(conn, :new)
    assert html_response(conn, 200) =~ "New Category"
  end

  @tag login_as: "samwell"
  test "creates category and redirects to show when data is valid", %{conn: conn} do
    conn = post conn, category_path(conn, :create), category: @create_attrs

    assert %{id: id} = redirected_params(conn)
    assert redirected_to(conn) == category_path(conn, :show, id)
    assert Repo.get_by(Category, @create_attrs)
  end

  @tag login_as: "samwell"
  test "does not create category and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, category_path(conn, :create), category: @invalid_attrs
    assert html_response(conn, 200) =~ "New Category"
  end

  @tag login_as: "samwell"
  test "renders form for editing chosen category", %{conn: conn} do
    category = fixture(:category)
    conn = get conn, category_path(conn, :edit, category)
    assert html_response(conn, 200) =~ "Edit Category"
  end

  @tag login_as: "samwell"
  test "updates chosen category and redirects when data is valid", %{conn: conn} do
    category = fixture(:category)
    conn = put conn, category_path(conn, :update, category), category: @update_attrs
    assert redirected_to(conn) == category_path(conn, :show, category)
    assert Repo.get_by(Category, @update_attrs)
  end

  @tag login_as: "samwell"
  test "does not update chosen category and renders errors when data is invalid", %{conn: conn} do
    category = fixture(:category)
    conn = put conn, category_path(conn, :update, category), category: @invalid_attrs
    assert redirected_to(conn) == category_path(conn, :show, category)
  end

  @tag login_as: "samwell"
  test "deletes chosen category", %{conn: conn} do
    category = fixture(:category)
    conn = delete conn, category_path(conn, :delete, category)
    assert redirected_to(conn) == category_path(conn, :index)
    refute Repo.get(Category, category.id)
  end
end
