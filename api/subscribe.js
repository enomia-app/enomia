export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, nombreBiens, source } = req.body;

  if (!email || !firstName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!publicationId || !apiKey) {
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          reactivation_intent: 'DOUBLE_OPT_IN',
          custom_fields: [
            { name: 'first_name', value: firstName },
            { name: 'nombre_biens', value: nombreBiens || '0' },
          ],
          tags: [
            'sequence_waitlist_beta',
            `${nombreBiens}_biens`,
            ...(source ? [source] : []),
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Beehiiv API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
