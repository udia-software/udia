defmodule UdiaWeb.PostView do
  use UdiaWeb, :view
  alias UdiaWeb.PostView
  alias UdiaWeb.UserView
  alias UdiaWeb.JourneyView

  def render("index.json", %{posts: posts, pagination: pagination}) do
    %{
      data: render_many(posts, PostView, "post.json"),
      pagination: pagination
    }
  end

  def render("show.json", %{post: post}) do
    %{data: render_one(post, PostView, "post.json")}
  end

  def render("post.json", %{post: post}) do
    %{id: post.id,
      title: post.title,
      type: post.type,
      content: post.content,
      inserted_at: post.inserted_at,
      updated_at: post.updated_at,
      author: render_one(post.author, UserView, "user.json"),
      journey: (if (post.journey_id != nil), do: render_one(post.journey, JourneyView, "journey.json"), else: nil)}
  end
end
