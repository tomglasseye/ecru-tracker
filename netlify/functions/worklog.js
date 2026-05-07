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

  const { domain, email, token, ticketKey, started, timeSpentSeconds, comment } = body

  if (!domain || !email || !token || !ticketKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    }
  }

  if (!timeSpentSeconds || timeSpentSeconds < 60) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Time logged must be at least 1 minute' }),
    }
  }

  const credentials = Buffer.from(`${email}:${token}`).toString('base64')

  const worklogBody = {
    started,
    timeSpentSeconds,
  }

  if (comment && comment.trim()) {
    worklogBody.comment = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: comment.trim() }],
        },
      ],
    }
  }

  try {
    const res = await fetch(`https://${domain}/rest/api/3/issue/${ticketKey}/worklog`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(worklogBody),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Jira returned ${res.status}`, detail: text }),
      }
    }

    const data = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, worklogId: data.id }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reach Jira', detail: err.message }),
    }
  }
}
