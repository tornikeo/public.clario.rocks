import type { Event } from "@prisma/client";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Navbar } from "~/app/_components/navbar";
import EventCard from "~/app/_components/event";
import { Suspense } from "react";

export default async function Home() {
  const events = await api.event.getAll();

  return (
    <HydrateClient>
      <Navbar />
      <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
        {/* Left Section: Events */}
        <section className="lg:basis-[70%]">
          <h1 className="text-2xl font-bold mb-4">Latest Events</h1>
          <Suspense fallback={<p>Loading events...</p>}>
            <div className="space-y-4">
              {events.map((event: Event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </Suspense>
        </section>

        {/* Right Section: Filters */}
        <aside className="lg:basis-[30%] bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Filters</h2>

          {/* Impact Filter */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Estimated Impact</h3>
            <select className="w-full border rounded p-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-gray-200 text-xs px-2 py-1 rounded">#nvda</button>
              <button className="bg-gray-200 text-xs px-2 py-1 rounded">#trump</button>
              <button className="bg-gray-200 text-xs px-2 py-1 rounded">#ceo</button>
            </div>
          </div>

          {/* News sources Filter */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">News Sources</h3>
            <select className="w-full border rounded p-2">
              <option value="nytimes">The New York Times</option>
              <option value="bbc">BBC</option>
              <option value="guardian">The Guardian</option>
            </select>
          </div>

          {/* News Channels Filter */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Channels</h3>
            <select className="w-full border rounded p-2">
              <option value="public-news">Public News</option>
              <option value="public-statements">Public Statements</option>
              <option value="income-earnings">Income Earnings</option>
              <option value="fed-statements">FED Statements</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Date Range</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                  From:
                </label>
                <input
                  id="start-date"
                  type="date"
                  className="w-full border rounded p-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                  To:
                </label>
                <input
                  id="end-date"
                  type="date"
                  className="w-full border rounded p-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </HydrateClient>
  );
}