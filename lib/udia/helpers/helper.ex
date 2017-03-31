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
defmodule Udia.Helper do
  alias Udia.Reactions

  @epoch {1970, 1, 1}
  @current_timestamp :calendar.now_to_datetime(:erlang.timestamp)

  defp epoch_seconds(naive_datetime) do
    datetime_seconds = NaiveDateTime.to_erl(naive_datetime) |> :calendar.datetime_to_gregorian_seconds
    epoch_seconds = :calendar.date_to_gregorian_days(@epoch) * 86400
    datetime_seconds - epoch_seconds
  end

  defp score(post_id), do: Reactions.get_point(post_id)

  def hot(post_id, naive_datetime) do
    s =
      case score(post_id) do
        [nil] -> 0
        [score] -> score
      end

    order = :math.log10(max(abs(s), 1))
    sign =
      cond do
        s > 0 -> 1
        s < 0 -> -1
        true -> 0
      end
    current_seconds = :calendar.datetime_to_gregorian_seconds(@current_timestamp)
    seconds = epoch_seconds(naive_datetime) - current_seconds
    Float.round(sign * order + seconds / 45000, 7)
  end
end
