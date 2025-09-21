// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Wipe existing data to keep idempotent for repeated runs
  await prisma.rawNews.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.post.deleteMany({}); // Delete posts first
  await prisma.user.deleteMany({}); // Then delete users

  // Create a user
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      image: 'https://example.com/john-doe.png',
    },
  });

  // Create a post
  const post = await prisma.post.create({
    data: {
      name: 'First Post',
      createdById: user.id,
    },
  });

  // Define events
  const events = [
    {
      title: 'NVIDIA stock plunges after DeepSeek vulnerability disclosed',
      summary: 'A critical DeepSeek vulnerability affecting NVIDIA driver stacks was disclosed, triggering heavy selling across semiconductor stocks and broad market volatility.',
      content: `A newly disclosed vulnerability in the DeepSeek component of NVIDIA's driver stack has been reported to allow privilege escalation and potential remote code execution under certain configurations. Initial exploit reports emerged from security researchers who emphasized the need for immediate patching; vendors and partners are coordinating mitigations while investigators assess the scope of active exploitation.`,
      time: new Date('2025-09-01T09:00:00Z'),
      tags: ['NVIDIA', 'deepseek', 'semiconductor', 'market'],
      url_sources: ['https://reuters.example/nvidia-deepseek', 'https://bloomberg.example/nvidia-deepseek'],
    },
    {
      title: 'Trump announces new tariffs on key imports, rattling markets',
      summary: 'New tariff measures announced by the administration target multiple tech and industrial imports, prompting investor concern about supply-chain inflation and retaliation risks.',
      content: `The administration unveiled a fresh slate of tariffs aimed at certain technology and industrial goods, citing national economic interests and domestic manufacturing protection.`,
      time: new Date('2025-08-15T13:30:00Z'),
      tags: ['tariffs', 'trade', 'policy', 'macroeconomics'],
      url_sources: ['https://reuters.example/trump-tariffs', 'https://bloomberg.example/trump-tariffs'],
    },
  ];

  // Insert events
  await prisma.event.createMany({
    data: events,
  });

  // Retrieve events (to get IDs and times) and generate raw news variants per event
  const eventsWithIds = await prisma.event.findMany({ orderBy: { id: 'asc' } });

  const portals = [
    { name: 'Reuters', host: 'reuters.example' },
    { name: 'Bloomberg', host: 'bloomberg.example' },
    { name: 'CNBC', host: 'cnbc.example' },
    { name: 'FT', host: 'ft.example' },
    { name: 'The Verge', host: 'theverge.example' },
    { name: 'MarketWatch', host: 'marketwatch.example' },
  ];

  const rawNewsBatch = [];

  eventsWithIds.forEach((evt, i) => {
    // Three distinct portal/wording variants per event
    const variants = [
      `Breaking: ${evt.title} — initial on-the-ground reporting with quotes from stakeholders.`,
      `${evt.title} analyzed: experts weigh in on the likely market implications and near-term risks.`,
      `Opinion: What ${evt.title} means for consumers and investors — takeaways and outlook.`,
    ];

    for (let v = 0; v < 3; v++) {
      const portal = portals[(i * 3 + v) % portals.length];
      rawNewsBatch.push({
        time: new Date(new Date(evt.time).getTime() + (v + 1) * 60_000), // Slightly offset times
        url: `https://${portal.host}/article/${evt.id}-${v}`,
        title: `${portal.name} — ${variants[v]}`,
        content: `${portal.name} — ${variants[v]} (source coverage of event id ${evt.id})`,
        createdEventId: evt.id,
        urgent: v === 0, // Mark the first variant as urgent
        urgent_confidence: v === 0 ? 90 : null,
        urgent_reason: v === 0 ? 'Breaking news with high market impact' : null,
        relevant: true,
        relevant_confidence: 80,
        relevant_reason: 'Related to high-impact event',
      });
    }
  });

  // Insert raw news
  await prisma.rawNews.createMany({
    data: rawNewsBatch,
  });

  console.log(`Seed complete: ${eventsWithIds.length} events, ${rawNewsBatch.length} rawNews entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });