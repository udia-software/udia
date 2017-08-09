defmodule UdiaWeb.PerceptionView do
  use UdiaWeb, :view
  alias UdiaWeb.UserView
  alias UdiaWeb.PerceptionView

  def render("index.json", %{perceptions: perceptions, pagination: pagination}) do
    %{
      data: render_many(perceptions, PerceptionView, "perception.json"),
      pagination: pagination
    }
  end

  def render("show.json", %{perception: perception}) do
    %{data: render_one(perception, PerceptionView, "perception.json")}
  end

  def render("perception.json", %{perception: perception}) do
    %{
      id: perception.id,
      start_time: perception.start_time,
      end_time: perception.end_time,
      post_id: perception.post_id,
      user: (
        if perception.user_id != nil do
          render_one(perception.user, UserView, "user.json")
        else
          nil
        end
      )
    }
  end
end
