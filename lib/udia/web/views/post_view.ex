defmodule Udia.Web.PostView do
  use Udia.Web, :view
  alias Udia.Web.PostView

  def render("index.json", %{posts: posts}) do
    %{data: render_many(posts, PostView, "post.json")}
  end

  def render("show.json", %{post: post}) do
    %{data: render_one(post, PostView, "post.json")}
  end

  def render("post.json", %{post: post}) do
    %{id: post.id,
      title: post.title,
      type: post.type,
      content: post.content}
  end
end
