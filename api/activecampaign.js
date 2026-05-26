export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nome, email, telefone, utms, formado, formacao } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Read securely from Vercel Environment Variables, with robust verified fallbacks
    const AC_API_URL = process.env.ACTIVE_CAMPAIGN_URL || 'https://ambientalpro.api-us1.com';
    const AC_API_KEY = process.env.ACTIVE_CAMPAIGN_KEY || '9617e0716b9a89bc87a2d382d9aeedc19df5bb57f5fd0af5278e9d788fe96c711fa0ebe6';
    const AC_TAG_ID = 445; // [L01][ACAODEVITALICIO] Lead Tag ID

    try {
        const fieldValues = [];
        
        const sourceVal = utms['L01ACAODEVITALICIO_UTM_SOURCE'] || utms['utm_source'] || '';
        const mediumVal = utms['L01ACAODEVITALICIO_UTM_MEDIUM'] || utms['utm_medium'] || '';
        const campaignVal = utms['L01ACAODEVITALICIO_UTM_CAMPAIGN'] || utms['utm_campaign'] || '';
        const contentVal = utms['L01ACAODEVITALICIO_UTM_CONTENT'] || utms['utm_content'] || '';
        const termVal = utms['L01ACAODEVITALICIO_UTM_TERM'] || utms['utm_term'] || '';

        // 1. Direct field mapping by verified ActiveCampaign custom field IDs
        if (sourceVal) fieldValues.push({ field: '755', value: sourceVal });
        if (campaignVal) fieldValues.push({ field: '756', value: campaignVal });
        if (mediumVal) fieldValues.push({ field: '757', value: mediumVal });
        if (termVal) fieldValues.push({ field: '758', value: termVal });
        if (contentVal) fieldValues.push({ field: '759', value: contentVal });

        // Generic UTM fields (fallback/redundancy support)
        if (sourceVal) fieldValues.push({ field: '12', value: sourceVal }); // utm_source
        if (mediumVal) fieldValues.push({ field: '11', value: mediumVal }); // utm_medium

        // Registration Date: formatted in Brasilia time (GMT-3)
        const now = new Date();
        const offsetMs = -3 * 60 * 60 * 1000;
        const localTime = new Date(now.getTime() + offsetMs);
        const formattedDate = localTime.toISOString().slice(0, 19).replace('T', ' ');
        fieldValues.push({ field: '760', value: formattedDate }); // [L01][ACAODEVITALICIO] UTM Data de inscrição

        // Formação / Graduação
        const formadoNormalized = formado === 'sim' ? 'Sim' : (formado === 'nao' ? 'Não' : formado);
        if (formadoNormalized) fieldValues.push({ field: '761', value: formadoNormalized }); // [L01][ACAODEVITALICIO] UTM Possui graduacão
        if (formacao) fieldValues.push({ field: '762', value: formacao }); // [L01][ACAODEVITALICIO] UTM Área de formação

        // 2. Sync / Upsert Contact in ActiveCampaign
        const nameParts = nome.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const contactPayload = {
            contact: {
                email,
                firstName,
                lastName,
                phone: telefone,
                fieldValues
            }
        };

        const contactRes = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
            method: 'POST',
            headers: { 
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactPayload)
        });

        if (!contactRes.ok) {
            const errData = await contactRes.text();
            throw new Error(`Sync contact failed: ${errData}`);
        }

        const contactData = await contactRes.json();
        const contactId = contactData.contact ? contactData.contact.id : null;

        if (contactId) {
            // 3. Directly Apply Tag 445 to Contact (Fastest, avoids extra API search/create requests)
            const tagRes = await fetch(`${AC_API_URL}/api/3/contactTags`, {
                method: 'POST',
                headers: { 
                    'Api-Token': AC_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactTag: { contact: contactId, tag: AC_TAG_ID } })
            });

            if (!tagRes.ok) {
                const tagErr = await tagRes.text();
                console.error(`Failed to apply tag 445 to contact ${contactId}:`, tagErr);
            }
        }

        return res.status(200).json({ success: true, contactId });
    } catch (error) {
        console.error('ActiveCampaign serverless handler error:', error);
        return res.status(500).json({ error: error.message });
    }
}
