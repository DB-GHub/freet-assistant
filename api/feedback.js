export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const PROJECT_ID = process.env.CUSTOMGPT_PROJECT_ID;
  const API_KEY = process.env.CUSTOMGPT_API_KEY;
  const { session_id, message_id, reaction } = req.body;

  if (!session_id || !message_id || !reaction) {
    return res.status(400).json({ error: 'Missing session_id, message_id, or reaction' });
  }

  try {
    const response = await fetch(
      `https://app.customgpt.ai/api/v1/projects/${PROJECT_ID}/conversations/${session_id}/messages/${message_id}/feedback`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ reaction })
      }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
