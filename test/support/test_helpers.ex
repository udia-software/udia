defmodule Udia.TestHelpers do
  def insert_user(attrs \\ %{}) do
    changes = attrs |> Enum.into(%{
      username: "user#{Base.encode16(:crypto.strong_rand_bytes(8))}",
      password: "supersecret",
    })

    {:ok, user} = Udia.Accounts.create_user(changes)
    user
  end
end