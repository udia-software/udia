defmodule Udia.Web.Presence do
  use Phoenix.Presence, otp_app: :udia,
                        pubsub_server: Udia.PubSub
end