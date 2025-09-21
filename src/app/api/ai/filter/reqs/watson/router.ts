import { NextResponse } from "next/server";
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { infer_watson } from "~/app/_utils/obligatory_watson";


export async function GET() {
  try {
    const res = await infer_watson("What's 2+2?");
    return NextResponse.json({ ok: true, response: res });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

