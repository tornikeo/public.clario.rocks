/**
 * Writes news to db
 */
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { PrismaClient } from "@prisma/client";
import type { RawNews } from "@prisma/client";

const parser = new Parser();
const prisma = new PrismaClient();

type Feed = { source: string; url: string };
type NewsItem = {
  source: string;
  title: string | undefined;
  link: string | undefined;
  published: string | undefined;
  summary: string | null | undefined;
};

const FEEDS: { source: string; url: string }[] = [
  { source: "BBC", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { source: "CNN", url: "http://rss.cnn.com/rss/edition_world.rss" },
  { source: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { source: "Guardian", url: "https://www.theguardian.com/world/rss" },
  { source: "WSJ", url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml" },
];

// Fetch and parse multiple feeds in parallel
async function fetchFeeds(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.map((item): NewsItem => ({
        source: feed.source,
        title: item.title,
        link: item.link,
        published: item.pubDate,
        summary:
          item.contentSnippet ??
          item.content ??
          item.summary ??
          null,
      }));
    })
  );

  // Flatten and filter out failed feeds
  return results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}

export async function POST() {
  try {
    const news = await fetchFeeds();

    // Sort newest first
    news.sort(
      (a, b) => new Date(b.published ?? 0).getTime() - new Date(a.published ?? 0).getTime()
    );

    // Limit the number of news items to avoid overloading the database
    const limitedNews = news.slice(0, 50);

    // Write news to the database, avoiding duplicates
    for (const item of limitedNews) {
      if (!item.title || !item.link || !item.published) {
        continue; // Skip invalid items
      }

      const existingNews = await prisma.rawNews.findFirst({
        where: { title: item.title, url: item.link },
      });

      if (!existingNews) {
        await prisma.rawNews.create({
          data: {
            time: new Date(item.published),
            url: item.link,
            title: item.title,
            content: item.summary ?? "",
          },
        });
      }
    }

    return NextResponse.json({ message: "News successfully written to the database." });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}