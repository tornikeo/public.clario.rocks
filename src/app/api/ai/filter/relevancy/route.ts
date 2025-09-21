import { NextResponse } from "next/server";
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from "~/server/db";
import type { RawNews } from "@prisma/client";

type ResponseData = {
  success: boolean;
  rowsUpdated: number;
};



export async function POST(request: Request): Promise<Response> {
  try {
    // Fetch RawNews entries that have not been filtered for relevancy
    const unfilteredNews = await db.rawNews.findMany({
      where: { relevant: null },
    });

    if (unfilteredNews.length === 0) {
      return NextResponse.json({ success: true, rowsUpdated: 0 });
    }

    // Process each news entry with AI
    const updates = await Promise.all(
      unfilteredNews.map(async (news) => {
        // Truncate content if it's too long
        const truncatedContent = news.content.length > 500
          ? `${news.content.slice(0, 500)}...`
          : news.content;

        const { object } = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: z.object({
            relevant: z.boolean(),
            confidence: z.number().int().min(0).max(100),
            brief_why: z.string().max(300),
          }),
          prompt: `You are given a short piece of news. Decide whether the content is relevant to finance or the economy.

Return strictly the three fields described in the schema:
- relevant: true if the news is about finance/economy (otherwise false)
- confidence: integer between 0 and 100 indicating confidence
- brief_why: one short sentence explaining the decision (concise)

# ${news.title}
${truncatedContent}

So, is this relevant?
`,
        });

        // Update the database with relevancy information
        return db.rawNews.update({
          where: { id: news.id },
          data: {
            relevant: object.relevant,
            relevant_confidence: object.confidence,
            relevant_reason: object.brief_why,
          },
        });
      })
    );

    // Return success response with the number of rows updated
    return NextResponse.json({
      success: true,
      rowsUpdated: updates.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

}