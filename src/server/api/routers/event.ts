import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const eventRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return db.event.findMany();
  }),
});