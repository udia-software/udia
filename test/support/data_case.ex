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
defmodule Udia.DataCase do
  @moduledoc """
  This module defines the setup for tests requiring
  access to the application's data layer.

  You may define functions here to be used as helpers in
  your tests.

  Finally, if the test case interacts with the database,
  it cannot be async. For this reason, every test runs
  inside a transaction which is reset at the beginning
  of the test unless the test case is marked as async.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      alias Udia.Repo
      alias Udia.Auths
      alias Udia.Logs
      alias Udia.Reactions

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import Udia.DataCase
      import Udia.TestHelpers
    end
  end

  setup tags do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Udia.Repo)

    unless tags[:async] do
      Ecto.Adapters.SQL.Sandbox.mode(Udia.Repo, {:shared, self()})
    end

    :ok
  end

  @doc """
  A helper that converts the changeset error messages
  for a given field into a list of strings for assertion:

      changeset = Blog.create_user(%{password: "short"})
      assert "password is too short" in errors_on(changeset, :password)

  """
  def errors_on(changeset, field) do
    for {message, opts} <- Keyword.get_values(changeset.errors, field) do
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end
  end
end
