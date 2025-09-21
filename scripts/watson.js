// @ts-nocheck
import { fetch } from 'undici';
import { error, log } from 'console';

/**
 * 
 * @param {string} prompt 
 * @returns string
 */
async function infer_watson(prompt) {
  process.env.WATSONX_AI_AUTH_TYPE = 'iam';
  process.env.WATSONX_AI_APIKEY = 'OMiYRg8XxlTc8L3SyMwTJuYMgdFLYgV94XKP-buIq1iU';

  const apiKey = process.env.WATSONX_AI_APIKEY;

  // Fetch IAM access token
  const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to fetch IAM token: ${tokenResponse.status} ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  const url = 'https://eu-de.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29';

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Compose the request body per official /text/chat endpoint structure
  const body = JSON.stringify({
    model_id: 'meta-llama/llama-3-3-70b-instruct',
    project_id: 'a5edd34b-73ec-435d-8c9a-b99424a2ace5',
    messages: [
      {
        role: "system",
        content: [
          { type: "text", text: "You are a helpful assistant designed to output JSON." }
        ]
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt }
        ]
      }
    ],
    frequency_penalty: 0,
    max_tokens: 300,
    presence_penalty: 0,
    temperature: 0.7,
    top_p: 1,
    seed: 42,
    stop: [],
    response_format: { type: 'json_object' }
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const responseText = await response.text();
      // console.log('Response text on error:', responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      const rawText = await response.text();
      console.error('Failed to parse JSON response. Raw response:', rawText);
      throw jsonErr;
    }

    const assistantMessage = data.choices?.[0]?.message?.content;
    return assistantMessage || 'No response';
  } catch (err) {
    console.error('Error calling WatsonX AI:', err);
    throw err;
  }
}

async function main() {
  const text = await infer_watson("How far is Paris from Tbilisi?");
  log(text);
}

main().catch(error);