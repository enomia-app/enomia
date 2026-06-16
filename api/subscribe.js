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

  if (!apiKey || !listNL) {
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  // Routing source -> liste. Tout le reste (NL-Blog-*, Livre-QR, Estimation, livret-download...) -> NL par defaut.
  let listId = listNL;
  if (source === 'ChannelManager') {
    listId = listChannel;
  } else if (['Contrat', 'Facturation', 'Simulateur_Auth'].includes(source)) {
    listId = listOutils;
  } else if (source === 'WaitlistSite') {
    listId = listWaitSite;
  }
  // source === 'Livre' (QR 4e de couverture → /livre) tombe volontairement dans la
  // liste NL par défaut : même consentement que la NL du site (1 email/mois).
  // La provenance se segmente dans Brevo via l'attribut SOURCE.

  const thisSource = source || 'direct';
  // 2e tag pour les outils : quel outil
  const outilType = { Simulateur_Auth: 'simulateur', Contrat: 'contrat', Facturation: 'facture' }[source];

  try {
    // Detecter une inscription multiple + historiser les points d'entree.
    // Fail-safe : si le GET echoue (contact inexistant ou erreur), on continue sans bloquer l'inscription.
    let priorSources = '';
    try {
      const existing = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
        headers: { 'api-key': apiKey, accept: 'application/json' },
      });
      if (existing.ok) {
        const c = await existing.json();
        priorSources = (c.attributes && c.attributes.SOURCES) || '';
      }
    } catch (_) { /* on continue */ }

    const sourceSet = new Set(String(priorSources).split(',').map((s) => s.trim()).filter(Boolean));
    sourceSet.add(thisSource);

    const attributes = {
      SOURCE: thisSource,                       // dernier point d'entree
      SOURCES: Array.from(sourceSet).join(','), // historique dedupliqué de tous les points d'entree
    };
    if (firstName) attributes.PRENOM = firstName;
    if (nombreBiens) attributes.NB_APPARTEMENT = nombreBiens;
    if (outilType) attributes.OUTIL_TYPE = outilType;
    // Inscrit via 2+ points d'entree differents -> a dedoublonner dans les parcours Brevo
    if (sourceSet.size > 1) attributes.MULTI_INSCRIPTION = true;

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
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: error.message || 'Brevo error' });
    }

    // POST /contacts renvoie 201 (cree, avec body) ou 204 (mis a jour, sans body) -> ne pas planter sur le 204.
    const data = await response.json().catch(() => ({ updated: true }));

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
