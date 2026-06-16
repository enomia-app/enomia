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
  const listWaitSite = parseInt(process.env.BREVO_LIST_WAITLIST_SITE, 10) || listNL;
  const listWaitCM = parseInt(process.env.BREVO_LIST_WAITLIST_CM, 10) || listNL;

  if (!apiKey || !listNL) {
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  // Route to the right list based on source
  let listId = listNL;
  if (source === 'ChannelManager') {
    listId = listChannel;
  } else if (['Contrat', 'Facturation', 'Simulateur_Auth'].includes(source)) {
    listId = listOutils;
  } else if (source === 'WaitlistSite') {
    listId = listWaitSite;
  } else if (source === 'WaitlistCM') {
    listId = listWaitCM;
  }
  // source === 'Livre' (QR 4e de couverture → /livre) tombe volontairement dans la
  // liste NL par défaut : même consentement que la NL du site (1 email/mois).
  // La provenance se segmente dans Brevo via l'attribut SOURCE.

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

    // Email de bienvenue (template Brevo) pour les inscrits de la liste NL :
    // envoi transactionnel -> géré en code, mais tracké dans Brevo (ouvertures/clics).
    // N'est PAS bloquant : un échec d'email ne fait pas rater l'inscription.
    if (listId === listNL) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
          body: JSON.stringify({
            to: [{ email, name: firstName || undefined }],
            templateId: parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID, 10) || 1,
          }),
        });
      } catch (mailErr) {
        console.error('Brevo welcome email error:', mailErr);
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Brevo API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
