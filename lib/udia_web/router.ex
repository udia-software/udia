defmodule UdiaWeb.Router do
  use UdiaWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug Guardian.Plug.VerifyHeader, realm: "Bearer"
    plug Guardian.Plug.LoadResource
  end

  scope "/", UdiaWeb do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
    get "/.well-known/acme-challenge/:id", LetsEncryptController, :index
  end

  # Other scopes may use custom stacks.
  scope "/api", UdiaWeb do
    pipe_through :api

    post "/sessions", SessionController, :create
    delete "/sessions", SessionController, :delete
    post "/sessions/refresh", SessionController, :refresh

    resources "/users", UserController, except: [:new, :edit]
    resources "/posts", PostController, except: [:new, :edit]
    resources "/comments", CommentController, except: [:new, :edit]
    resources "/journeys", JourneyController, except: [:new, :edit]
  end
end
