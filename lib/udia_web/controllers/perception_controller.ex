defmodule UdiaWeb.PerceptionController do
  use UdiaWeb, :controller

  import Ecto.Query
  alias Udia.Records.Perception

  action_fallback UdiaWeb.FallbackController

  def index(conn, params) do
    page = cond do
      Map.has_key?(params, "post_id") ->
        post_id = Map.get(params, "post_id")

        Perception
        |> where([p], p.post_id == ^post_id)
        |> order_by(desc: :start_time)
        |> Udia.Repo.paginate(params)
      Map.has_key?(params, "username") ->
        username = Map.get(params, "username")
        user = Udia.Accounts.get_user_by_username!(username)

        Perception
        |> where([p], p.user_id == ^user.id)
        |> order_by(desc: :start_time)
        |> Udia.Repo.paginate(params)
      true ->
        Perception
        |> order_by(desc: :start_time)
        |> Udia.Repo.paginate(params)
    end

    perceptions = page.entries
      |> Udia.Repo.preload(:user)
    render(conn, "index.json", perceptions: perceptions,
      pagination: UdiaWeb.PaginationHelpers.pagination(page))
  end
end
