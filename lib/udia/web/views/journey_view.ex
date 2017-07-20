defmodule Udia.Web.JourneyView do
  use Udia.Web, :view
  alias Udia.Web.JourneyView

  def render("index.json", %{journeys: journeys}) do
    %{data: render_many(journeys, JourneyView, "journey.json")}
  end

  def render("show.json", %{journey: journey}) do
    %{data: render_one(journey, JourneyView, "journey.json")}
  end

  def render("journey.json", %{journey: journey}) do
    %{id: journey.id,
      title: journey.title,
      description: journey.description}
  end
end
