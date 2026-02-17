/**
 * Centralized Pagination Utilities
 * 
 * Provides pagination helpers for:
 * - Supabase queries
 * - Page navigation
 * - Load more functionality
 */

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Paginate a Supabase query
 * NOTE: This function preserves the existing select() from the query
 * If the query already has a select(), it will be preserved. Otherwise, defaults to '*'
 */
export async function paginateQuery(query, options = {}) {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    orderBy = 'created_at',
    ascending = false,
    selectOverride = null,
    abortSignal = null
  } = options;

  const limit = Math.min(pageSize, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  // Apply ordering and range
  let finalQuery = query
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  // Only apply default select if selectOverride is provided
  // If no selectOverride and query already has selections, Supabase handles it
  if (selectOverride) {
    finalQuery = finalQuery.select(selectOverride, { count: 'exact' });
  }

  // Handle AbortSignal
  if (abortSignal) {
    finalQuery = finalQuery.abortSignal(abortSignal);
  }

  const result = await finalQuery;
  const { data, error, count } = result;

  if (error) throw error;

  const totalPages = count ? Math.ceil(count / limit) : 0;
  const hasMore = page < totalPages;

  return {
    data: data || [],
    page,
    pageSize: limit,
    totalCount: count || 0,
    totalPages,
    hasMore,
    hasPrevious: page > 1
  };
}

/**
 * Load more data (append to existing)
 */
export async function loadMoreQuery(query, currentData, options = {}) {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    orderBy = 'created_at',
    ascending = false
  } = options;

  const currentCount = currentData.length;
  const limit = Math.min(pageSize, MAX_PAGE_SIZE);

  const { data, error } = await query
    .order(orderBy, { ascending })
    .range(currentCount, currentCount + limit - 1)
    .select('*');

  if (error) throw error;

  return {
    data: data || [],
    hasMore: (data || []).length === limit
  };
}

/**
 * Create pagination state hook helper
 */
export function createPaginationState() {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
    hasPrevious: false,
    isLoading: false
  };
}

/**
 * Get pagination info for display
 */
export function getPaginationInfo(paginationState) {
  const { page, totalPages, totalCount, pageSize } = paginationState;
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return {
    start,
    end,
    total: totalCount,
    showing: `${start}-${end} of ${totalCount}`
  };
}

