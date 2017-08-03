defmodule UdiaWeb.PerceptionController do
  use UdiaWeb, :controller

  alias Udia.Records
  alias Udia.Records.Perception

  action_fallback UdiaWeb.FallbackController

  def index(conn, _params) do
    perceptions = Records.list_perceptions()
    render(conn, "index.json", perceptions: perceptions)
  end

  def create(conn, %{"perception" => perception_params}) do
    with {:ok, %Perception{} = perception} <- Records.create_perception(perception_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", perception_path(conn, :show, perception))
      |> render("show.json", perception: perception)
    end
  end

  def show(conn, %{"id" => id}) do
    perception = Records.get_perception!(id)
    render(conn, "show.json", perception: perception)
  end

  def update(conn, %{"id" => id, "perception" => perception_params}) do
    perception = Records.get_perception!(id)

    with {:ok, %Perception{} = perception} <- Records.update_perception(perception, perception_params) do
      render(conn, "show.json", perception: perception)
    end
  end

  def delete(conn, %{"id" => id}) do
    perception = Records.get_perception!(id)
    with {:ok, %Perception{}} <- Records.delete_perception(perception) do
      send_resp(conn, :no_content, "")
    end
  end
end
