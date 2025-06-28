import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = await req.json(); // For JSON body
    const { type, value, imageData } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (type === 'text') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `Predict Wingo result for period ${value}. Output either BIG or SMALL.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const prediction = data.choices[0]?.message?.content?.trim();
      return res.status(200).json({ prediction });
    }

    if (type === 'image' && imageData) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this Wingo chart and predict the next result (BIG or SMALL).',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData,
                  },
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const prediction = data.choices[0]?.message?.content?.trim();
      return res.status(200).json({ prediction });
    }

    return res.status(400).json({ error: 'Invalid input format' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error', detail: error.message });
  }
}

