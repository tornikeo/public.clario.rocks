/**
 * Takes all un-eventized raw events, clusters them into new Event-s
 * saves them to DB. Clustering happens by asking AI to come up with a list of distinct Events via a prompt.
 * 
 * Returns the number of added events.
 */

import { NextRequest, NextResponse } from "next/server";
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { Event, RawNews } from "@prisma/client";
import { db } from "~/server/db";
import { generateObject } from 'ai';
import type { LanguageModel } from "ai";
import { WatsonXAI } from '@ibm-cloud/watsonx-ai';
import { error, log } from 'console';


export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawNews: RawNews[] = await db.rawNews.findMany({
      where: {
        createdEventId: null,
      },
    });

    if (rawNews.length === 0) {
      return NextResponse.json({ message: "No raw news to process.", eventsCreated: 0 });
    }

    // Limit each news content to 200 characters and use a clear delimiter
    const newsContents = rawNews
      .map((news) => `# (ID: ${news.id}) "${news.title}"\n${news.content.slice(0, 200)}\nURL:${news.url}`)
      .join("\n\n---\n\n");

    // GenerateObject with a valid schema
    const { object: response } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        events: z.array(
          z.object({
            title: z.string().min(10).max(100),
            summary: z.string().min(10).max(200),
            content: z.string().min(10).max(2000),
            time: z.string().datetime(), // Ensure time is a valid ISO string
            is_important: z.boolean(),
            url_sources: z.array(z.string()).min(1).max(3)
          })
        ),
      }),
      prompt: `You are given a list of raw news items. Your task is to cluster them into distinct events. 
Each event should have:
- A title (short and descriptive)
- A summary (summarizing the event in 200 characters or less)
- A detailed content (describing the event in detail)
- A list of primary sources (URLs) for this event (url_sources)
- The time the event occurred (in ISO 8601 format).
- Importancy of the event - is the even both urgent *and* relevant for financial markets?

Important events are market-moving events like:
1. Unexpected global conflicts and problems
2. Unexpected US Federal bank decisions
3. CEO exits from major companies

Limit the number of events to 5 at *most*. It might be that there are no important events at all for now.

${newsContents}

Return a JSON object with a single key "events", which is an array of events. Each event should have the fields: title, summary, content, sources, and time.`,});

    // Clear the database and populate it with important events in a single transaction
    await db.$transaction(async (prisma) => {
      // Clear the database
      await prisma.event.deleteMany({});

      // Populate the database with important events
      const eventsToCreate = response.events
        .filter(event => event.is_important)
        .map(event => ({
          title: event.title,
          summary: event.summary,
          content: event.content,
          url_sources: event.url_sources,
          time: new Date(event.time),
        }));

      await prisma.event.createMany({ data: eventsToCreate });
    });

    return NextResponse.json({ message: "Events created successfully.", eventsCreated: response.events.filter(event => event.is_important).length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}