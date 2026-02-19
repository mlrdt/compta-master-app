import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un assistant comptable expert. Tu aides à créer des factures à partir de documents (bons de commande, contrats, devis, emails, etc.).

Quand l'utilisateur t'envoie un document, tu dois :
1. Extraire les informations pertinentes (client, articles/services, montants, dates)
2. Proposer une facture structurée au format JSON

Quand tu proposes une facture, TOUJOURS inclure un bloc JSON dans ta réponse avec cette structure exacte :
\`\`\`invoice_json
{
  "client_name": "Nom du client",
  "client_email": "",
  "client_address": "Adresse",
  "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "AED",
  "notes": "",
  "items": [
    {
      "description": "Description du service/produit",
      "quantity": 1,
      "unit_price": 0,
      "vat_rate": 5
    }
  ]
}
\`\`\`

Règles :
- Devise par défaut : AED (sauf si le document indique autre chose)
- TVA par défaut : 5% (UAE)
- Dates au format YYYY-MM-DD
- Si une info est manquante, mets une valeur par défaut et signale-le
- Réponds toujours en français
- Si l'utilisateur demande une modification, renvoie le JSON complet mis à jour
- Sois concis dans tes explications`;

export async function POST(request) {
  try {
    const { messages, files } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée. Ajoute OPENAI_API_KEY dans les variables d\'environnement.' },
        { status: 500 }
      );
    }

    // Build OpenAI messages
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        const content = [];

        // Add text
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }

        // Add files (images as vision, others as text description)
        if (msg.files && msg.files.length > 0) {
          for (const file of msg.files) {
            if (file.type?.startsWith('image/') && file.base64) {
              content.push({
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${file.base64}`,
                  detail: 'high',
                },
              });
            } else if (file.url) {
              // For PDFs and other files, include the URL
              content.push({
                type: 'text',
                text: `[Document joint : ${file.name} (${file.type})] URL: ${file.url}`,
              });
            }
          }
        }

        openaiMessages.push({
          role: 'user',
          content: content.length === 1 && content[0].type === 'text'
            ? content[0].text
            : content,
        });
      } else if (msg.role === 'assistant') {
        openaiMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      max_tokens: 4096,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content || '';

    // Extract invoice JSON if present
    let invoiceData = null;
    const jsonMatch = reply.match(/```invoice_json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        invoiceData = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        // JSON parsing failed, that's ok
      }
    }

    return NextResponse.json({
      message: reply,
      invoice_data: invoiceData,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'appel à OpenAI' },
      { status: 500 }
    );
  }
}
