defmodule UdiaWeb.JourneyView do
  use UdiaWeb, :view
  alias UdiaWeb.JourneyView
  alias UdiaWeb.UserView

  def render("index.json", %{journeys: journeys, pagination: pagination}) do
    %{
      data: render_many(journeys, JourneyView, "journey.json"),
      pagination: pagination
    }
  end

  def render("show.json", %{journey: journey}) do
    %{data: render_one(journey, JourneyView, "journey.json")}
  end

  def render("journey.json", %{journey: journey}) do
    %{id: journey.id,
      title: journey.title,
      description: journey.description,
      explorer: render_one(journey.explorer, UserView, "user.json"),
      inserted_at: journey.inserted_at,
      updated_at: journey.updated_at,
      start_date: journey.start_date,
      end_date: journey.end_date
    }
  end
end
