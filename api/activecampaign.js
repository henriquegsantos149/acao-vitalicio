export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nome, email, telefone, utms, formado, formacao } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const AC_API_URL = 'https://ambientalpro.api-us1.com';
    const AC_API_KEY = '9617e0716b9a89bc87a2d382d9aeedc19df5bb57f5fd0af5278e9d788fe96c711fa0ebe6';
    const AC_TAG_NAME = '[L01][ACAODEVITALICIO] Lead';

    try {
        // 1. Fetch Custom Fields to map UTMs and Formacao
        const fieldsRes = await fetch(`${AC_API_URL}/api/3/fields?limit=100`, {
            headers: { 'Api-Token': AC_API_KEY }
        });
        
        let fieldMap = {};
        if (fieldsRes.ok) {
            const data = await fieldsRes.json();
            if (data.fields) {
                data.fields.forEach(f => {
                    fieldMap[f.title.toLowerCase().trim()] = f.id;
                });
            }
        }

        const fieldValues = [];
        
        const sourceVal = utms['L01ACAODEVITALICIO_UTM_SOURCE'] || utms['utm_source'] || '';
        const mediumVal = utms['L01ACAODEVITALICIO_UTM_MEDIUM'] || utms['utm_medium'] || '';
        const campaignVal = utms['L01ACAODEVITALICIO_UTM_CAMPAIGN'] || utms['utm_campaign'] || '';
        const contentVal = utms['L01ACAODEVITALICIO_UTM_CONTENT'] || utms['utm_content'] || '';
        const termVal = utms['L01ACAODEVITALICIO_UTM_TERM'] || utms['utm_term'] || '';

        function addField(titleOptions, value) {
            if (!value) return;
            const normalizedOptions = titleOptions.map(opt => opt.toLowerCase().trim());
            for (const option of normalizedOptions) {
                const cleanOption = option.replace(/[^a-z0-9]/g, '');
                for (const key in fieldMap) {
                    const cleanKey = key.replace(/[^a-z0-9]/g, '');
                    if (cleanKey === cleanOption || cleanKey.includes(cleanOption) || cleanOption.includes(cleanKey)) {
                        fieldValues.push({ field: fieldMap[key], value: value });
                        return;
                    }
                }
            }
        }

        // Map UTM fields with expanded match variations
        addField(['L01ACAODEVITALICIO_UTM_SOURCE', 'utm_source', 'utm source', 'source'], sourceVal);
        addField(['L01ACAODEVITALICIO_UTM_MEDIUM', 'utm_medium', 'utm medium', 'medium'], mediumVal);
        addField(['L01ACAODEVITALICIO_UTM_CAMPAIGN', 'utm_campaign', 'utm campaign', 'campaign'], campaignVal);
        addField(['L01ACAODEVITALICIO_UTM_CONTENT', 'utm_content', 'utm content', 'content'], contentVal);
        addField(['L01ACAODEVITALICIO_UTM_TERM', 'utm_term', 'utm term', 'term'], termVal);

        // Normalize formed status for nice Sheet representation
        const formadoNormalized = formado === 'sim' ? 'Sim' : (formado === 'nao' ? 'Não' : formado);
        addField(['possui graduacao', 'possui graduação', 'formado', 'graduado', 'voce ja e formado'], formadoNormalized);
        addField(['area de formacao', 'área de formação', 'formacao', 'formação', 'qual a sua formação'], formacao);

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
            // 3. Get or Create Tag
            const searchRes = await fetch(`${AC_API_URL}/api/3/tags?search=${encodeURIComponent(AC_TAG_NAME)}`, {
                headers: { 'Api-Token': AC_API_KEY }
            });
            const searchData = await searchRes.json();
            
            let tagId;
            if (searchData.tags && searchData.tags.length > 0) {
                tagId = searchData.tags[0].id;
            } else {
                const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
                    method: 'POST',
                    headers: { 
                        'Api-Token': AC_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tag: { tag: AC_TAG_NAME, tagType: 'contact', description: '' } })
                });
                const createData = await createRes.json();
                tagId = createData.tag.id;
            }

            // 4. Apply Tag to Contact
            await fetch(`${AC_API_URL}/api/3/contactTags`, {
                method: 'POST',
                headers: { 
                    'Api-Token': AC_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
            });
        }

        return res.status(200).json({ success: true, contactId });
    } catch (error) {
        console.error('ActiveCampaign serverless handler error:', error);
        return res.status(500).json({ error: error.message });
    }
}
