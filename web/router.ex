###############################################################################
# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# https://raw.githubusercontent.com/udia-software/udia/master/LICENSE.
# The License is based on the Mozilla Public License Version 1.1, but
# Sections 14 and 15 have been added to cover use of software over a computer
# network and provide for limited attribution for the Original Developer.
# In addition, Exhibit A has been modified to be consistent with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is UDIA.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is Udia Software Incorporated.
#
# All portions of the code written by UDIA are Copyright (c) 2016-2017
# Udia Software Incorporated. All Rights Reserved.
###############################################################################
defmodule Udia.Router do
  use Udia.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Udia.Auth, repo: Udia.Repo
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Udia do
    # These routes need authentication
    pipe_through [:browser, :authenticate_user]
    # TODO: remove node pages for the form and only have the endpoints for creating the data (Create, Update, Delete)
    resources "/nodes", NodeController, only: [:new, :create, :edit, :update, :delete]
    resources "/comments", CommentController, only: [:create, :update, :delete]
  end

  scope "/", Udia do
    pipe_through :browser
    # Route for handling Lets Encrypt challenge validation
    get "/.well-known/acme-challenge/:id", LetsencryptController, :index

    resources "/users", UserController, only: [:index, :show, :new, :create]
    resources "/sessions", SessionController, only: [:new, :create, :delete]

    resources "/nodes", NodeController, only: [:show]
    get "/", NodeController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", Udia do
  #   pipe_through :api
  # end
end
