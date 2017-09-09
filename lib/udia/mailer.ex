defmodule Udia.Mailer do
  use Bamboo.Mailer, otp_app: :udia
  import Bamboo.Email

  def welcome_email do
    new_email(
      to: "admin@alexander-wong.com",
      from: "support@myapp.com",
      subject: "Welcome to the app.",
      html_body: "<strong>Thanks for joining!</strong>",
      text_body: "Thanks for joining!"
    )
  end
end
