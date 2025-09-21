// @ts-nocheck

import { Client } from 'undici';

async function relevancy() {
  const client = new Client('http://localhost:3000'); // Adjust the base URL if needed
  const payload = {
    id: 1, // Optional
    time: '2025-09-20T12:00:00Z', // Optional, ISO date string
    url: 'https://example.com/news', // Optional, valid URL
    content: 'Stocks rallied after the central bank cut interest rates.', // Required
  };

  try {
    const { statusCode, body } = await client.request({
      path: '/api/ai/filter/relevancy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (statusCode !== 200) {
      console.error(`Error: ${statusCode}`);
      const error = await body.json();
      console.error('Details:', error);
      return;
    }

    const data = await body.json();
    console.log('Response from endpoint:', data);
  } catch (error) {
    console.error('Failed to invoke endpoint:', error.message);
  } finally {
    client.close();
  }
};

async function urgency() {
  const client = new Client('http://localhost:3000'); // Adjust the base URL if needed
  const payload = {
    id: 1, // Optional
    time: '2025-09-20T12:00:00Z', // Optional, ISO date string
    url: 'https://example.com/news', // Optional, valid URL
    content: 'Stocks rallied after the central bank cut interest rates.', // Required
  };

  try {
    const { statusCode, body } = await client.request({
      path: '/api/ai/filter/urgency',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (statusCode !== 200) {
      console.error(`Error: ${statusCode}`);
      const error = await body.json();
      console.error('Details:', error);
      return;
    }

    const data = await body.json();
    console.log('Response from endpoint:', data);
  } catch (error) {
    console.error('Failed to invoke endpoint:', error.message);
  } finally {
    client.close();
  }
};

async function main()
{
  await relevancy();
  await urgency();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
  })