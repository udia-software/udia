defmodule Udia.TestHelpers do
  def insert_user(attrs \\ %{}) do
    changes = attrs |> Enum.into(%{
      username: "user#{Base.encode16(:crypto.strong_rand_bytes(8))}",
      password: "supersecret",
    })

    {:ok, user_versioned} = Udia.Accounts.create_user(changes)
    Map.get(user_versioned, :model)
  end
end