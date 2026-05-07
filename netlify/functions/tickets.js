export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { domain, email, token, query } = body

  if (!domain || !email || !token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing domain, email, or token' }),
    }
  }

  const credentials = Buffer.from(`${email}:${token}`).toString('base64')

  let jql
  if (query && query.trim()) {
    const q = query.trim()
    // Check if it looks like a ticket key (e.g. DEV-123)
    if (/^[A-Z]+-\d+/.test(q)) {
      jql = `key = "${q}" OR text ~ "${q}" ORDER BY updated DESC`
    } else {
      jql = `text ~ "${q}" ORDER BY updated DESC`
    }
  } else {
    jql = `assignee = currentUser() AND updated >= -30d ORDER BY updated DESC`
  }

  try {
    const url = `https://${domain}/rest/api/3/search/jql`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        jql,
        maxResults: 20,
        fields: ['summary', 'status', 'issuetype'],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Jira returned ${res.status}`, detail: text }),
      }
    }

    const data = await res.json()
    const tickets = (data.issues || []).map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || '',
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tickets),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reach Jira', detail: err.message }),
    }
  }
}
