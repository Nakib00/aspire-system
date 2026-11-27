/**
 * @file Model layer: HTTP client for the Aspire REST API (`/api/v1`).
 */
const apiBase = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Call the Aspire API and return the decoded JSON body.
 *
 * @param {string} path - Path below the API base, e.g. `/teacher/classes`.
 * @param {object} [options]
 * @param {string} [options.token] - Bearer token of the signed-in user.
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [options.method='GET'] - HTTP verb.
 * @param {object|FormData} [options.body] - JSON payload, or FormData for file uploads.
 * @returns {Promise<any>} The parsed response body.
 * @throws {Error} With a user-readable message; `status` and `fields` (validation errors) are attached when the server answered.
 */
export async function request(path, { token, method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Unable to reach the server. Check that the backend is running and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.errors ? Object.values(data.errors).flat().join(' ') : data.message
    const error = new Error(message || 'Something went wrong. Please try again.')
    error.status = response.status
    error.fields = data.errors || {}
    throw error
  }
  return data
}

/**
 * Fetch every page of a paginated endpoint and return the merged items.
 *
 * @param {string} path - Collection path, e.g. `/admin/centers`.
 * @param {string} token - Bearer token of the signed-in user.
 * @returns {Promise<Array>} All items from every page, in server order.
 */
export async function getAll(path, token) {
  const items = []
  let page = 1
  let last = 1
  while (page <= last) {
    const result = await request(`${path}?page=${page}`, { token })
    items.push(...result.data)
    last = result.last_page || 1
    page += 1
  }
  return items
}
