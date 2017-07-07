defmodule Udia.Web.PostView do
  use Udia.Web, :view
  alias Udia.Web.PostView
  alias Udia.Web.UserView

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
      author: render_one(post.author, UserView, "user.json")}
  end
end
