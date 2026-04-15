export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, nombreBiens, source } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listNL = parseInt(process.env.BREVO_LIST_ID, 10);
  const listOutils = parseInt(process.env.BREVO_LIST_OUTILS, 10) || listNL;
  const listChannel = parseInt(process.env.BREVO_LIST_CHANNEL, 10) || listNL;

  if (!apiKey || !listNL) {
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  // Route to the right list based on source
  let listId = listNL;
  if (source === 'ChannelManager') {
    listId = listChannel;
  } else if (['Contrat', 'Facturation', 'Simulateur_Auth'].includes(source)) {
    listId = listOutils;
  }

  try {
    const attributes = { SOURCE: source || 'direct' };
    if (firstName) attributes.PRENOM = firstName;
    if (nombreBiens) attributes.NB_APPARTEMENT = nombreBiens;

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Brevo API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
