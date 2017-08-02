defmodule UdiaWeb.LetsEncryptController do
  @moduledoc """
  Controller for rendering lets encrypt challenge text 
  """
  use UdiaWeb, :controller

  def index(conn, _params) do
    challenge = Application.get_env(:udia, :lets_encrypt)[:challenge]
    text conn, "#{challenge}"
  end
end
