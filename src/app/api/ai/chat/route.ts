import { NextResponse } from "next/server";
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';


export async function GET() {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: z.object({
        recipe: z.object({
          name: z.string(),
          ingredients: z.array(z.string()),
          steps: z.array(z.string()),
        }),
      }),
      prompt: 'Generate a lasagna recipe.',
    });
    return NextResponse.json({ object });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

