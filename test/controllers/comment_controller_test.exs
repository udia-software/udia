defmodule Udia.CommentControllerTest do
  use Udia.ConnCase

  @session_opts Plug.Session.init [
    store: :cookie,
    key: "_test",
    encryption_salt: "abcdef",
    signing_salt: "abcdef"
  ]

  setup do
    user = insert_user(%{})
    conn = build_conn()
           |> assign(:current_user, user)
           |> Plug.Session.call(@session_opts)
           |> Plug.Conn.fetch_session

    {:ok, conn: conn, user: user}
  end

  # This is a bit hard to test CommentController
  # without a node_id associate with the comment!
  # test "create a new comment", %{conn: conn, user: user} do
  #   conn = post conn, "/comments", %{"comment" => %{body: "some content"}}
  #   IO.inspect conn

  #   assert get_flash(conn, :info) == "Comment created successfully."
  # end
end
