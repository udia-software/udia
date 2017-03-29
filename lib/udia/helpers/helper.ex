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
  @epoch Date.from_erl!({1970, 1, 1})

  def epoch_seconds(date) do
    date_seconds = :calendar.date_to_gregorian_days(date) * 86400
    epoch_seconds = :calendar.date_to_gregorian_days(@epoch) * 86400
    date_seconds - epoch_seconds
  end

  def score(ups, downs), do: ups - downs

  def hot(ups, downs, date) do
    s = score(ups, downs)
    order = :math.log10(max(abs(s), 1))
    sign =
      cond do
        s > 0 -> 1
        s < 0 -> -1
        true -> 0
      end
    seconds = epoch_seconds(date) - 1134028003
    Float.round(sign * order + seconds / 45000, 7)
  end
end
