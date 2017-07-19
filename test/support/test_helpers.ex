defmodule Udia.TestHelpers do
  def insert_user(attrs \\ %{}) do
    changes = attrs |> Enum.into(%{
      username: "user#{Base.encode16(:crypto.strong_rand_bytes(8))}",
      password: "supersecret",
    })

    {:ok, user_versioned} = Udia.Accounts.create_user(changes)
    Map.get(user_versioned, :model)
  end

  def insert_post(%Udia.Accounts.User{} = user, attrs \\%{}) do
    changes = attrs |> Enum.into(%{
      title: "Random Title #{Base.encode16(:crypto.strong_rand_bytes(8))}",
      content: "Random Content #{Base.encode16(:crypto.strong_rand_bytes(8))}",
      type: "text",
    })
    {:ok, post_versioned} = Udia.Logs.create_post(user, changes)
    Map.get(post_versioned, :model)
  end

  def insert_comment(%Udia.Accounts.User{} = user, %Udia.Logs.Post{} = post, attrs \\%{}) do
    changes = attrs |> Enum.into(%{
      post_id: post.id,
      content: "Random Content #{Base.encode16(:crypto.strong_rand_bytes(8))}",
      type: "text",
      parent_id: nil,
    })
    {:ok, comment_versioned} = Udia.Logs.create_comment(user, changes)
    Map.get(comment_versioned, :model)
  end
end
