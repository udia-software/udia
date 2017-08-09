defmodule UdiaWeb.Presence do
  @moduledoc """
  Module for presence functionality
  """
  use Phoenix.Presence, otp_app: :udia,
                        pubsub_server: Udia.PubSub
end
