function buildComment(text) {
  if (!text || !text.trim()) return undefined
  return {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: text.trim() }] }],
  }
}

function formatStarted(isoString) {
  // Jira requires format: 2021-01-17T12:34:00.000+0000
  return new Date(isoString).toISOString().replace('Z', '+0000')
}

export const handler = async (event) => {
  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { domain, email, token, ticketKey, worklogId, started, timeSpentSeconds, comment, action } = body

  if (!domain || !email || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing credentials' }) }
  }

  const credentials = Buffer.from(`${email}:${token}`).toString('base64')
  const headers = {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  const base = `https://${domain}/rest/api/3/issue/${ticketKey}/worklog`

  try {
    // DELETE existing worklog
    if (action === 'delete') {
      if (!worklogId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing worklogId' }) }
      const res = await fetch(`${base}/${worklogId}`, { method: 'DELETE', headers })
      return { statusCode: 200, body: JSON.stringify({ ok: res.ok }) }
    }

    if (!timeSpentSeconds || timeSpentSeconds < 60) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Time logged must be at least 1 minute' }) }
    }

    const payload = {
      started: formatStarted(started),
      timeSpentSeconds,
      comment: buildComment(comment),
    }

    // UPDATE existing worklog
    if (action === 'update' && worklogId) {
      const res = await fetch(`${base}/${worklogId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        return { statusCode: res.status, body: JSON.stringify({ error: `Jira returned ${res.status}`, detail: text }) }
      }
      const data = await res.json()
      return { statusCode: 200, body: JSON.stringify({ ok: true, worklogId: data.id }) }
    }

    // CREATE new worklog
    const res = await fetch(base, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return { statusCode: res.status, body: JSON.stringify({ error: `Jira returned ${res.status}`, detail: text }) }
    }
    const data = await res.json()
    return { statusCode: 200, body: JSON.stringify({ ok: true, worklogId: data.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to reach Jira', detail: err.message }) }
  }
}
