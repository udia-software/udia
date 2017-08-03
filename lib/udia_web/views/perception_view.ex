defmodule UdiaWeb.PerceptionView do
  use UdiaWeb, :view
  alias UdiaWeb.PerceptionView

  def render("index.json", %{perceptions: perceptions}) do
    %{data: render_many(perceptions, PerceptionView, "perception.json")}
  end

  def render("show.json", %{perception: perception}) do
    %{data: render_one(perception, PerceptionView, "perception.json")}
  end

  def render("perception.json", %{perception: perception}) do
    %{id: perception.id,
      start_time: perception.start_time,
      end_time: perception.end_time}
  end
end
