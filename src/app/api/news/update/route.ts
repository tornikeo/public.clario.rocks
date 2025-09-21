// @ts-nocheck
import finnhub from 'finnhub';
import { db } from "~/server/db";
import { NextResponse } from "next/server";

const finnhubClient = new finnhub.DefaultApi(process.env.FINNHUB_API_KEY)

function marketNewsAsync(category: string, opts: Record<string, unknown> = {}): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      finnhubClient.marketNews(category, opts, (error: any, data: any, response: any) => {
        if (error) return reject(error);
        if (!data || !Array.isArray(data)) return resolve([]);
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST() {
  try {
    const data = await marketNewsAsync("general", {});

    const rawNewsItems = data.map((item: any) => ({
      time: item.datetime ? new Date(item.datetime * 1000) : new Date(),
      url: item.url ?? "",
      title: item.headline ?? "Untitled", // Add the title property
      content: (item.headline ?? "") + (item.summary ? ` - ${item.summary}` : ""),
    }));

    let saved = 0;
    for (const news of rawNewsItems) {
      try {
        await db.rawNews.create({ data: news });
        saved++;
      } catch (dbErr) {
        console.error("DB error:", dbErr);
      }
    }

    console.log(`Saved ${saved} news items`);
    return NextResponse.json({ ok: true, saved, total: rawNewsItems.length });
  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}