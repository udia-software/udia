defmodule UdiaWeb.PaginationHelpers do
  @moduledoc """
  Helper method for API pagination
  """
  def pagination(page) do
    %{
      page_number: page.page_number,
      page_size: page.page_size,
      total_pages: page.total_pages,
      total_entries: page.total_entries
    }
  end
end
