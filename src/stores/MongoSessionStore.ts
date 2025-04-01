import type {
  NodeSavedSession,
  NodeSavedSessionStore,
} from "@atproto/oauth-client-node";
import OAuthSession from "../models/OAuthSession";

export const mongoSessionStore: NodeSavedSessionStore = {
  async set(sub: string, session: NodeSavedSession): Promise<void> {
    const sessionData = {
      ...session,
      sub: sub,
    };
    await OAuthSession.updateOne(
      { sub },
      { $set: sessionData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  },
  async get(sub: string): Promise<NodeSavedSession | undefined> {
    const sessionDoc = await OAuthSession.findOne({ sub }).lean();
    if (!sessionDoc) return undefined;

    const { _id, __v, sub: docSub, createdAt, ...savedSession } = sessionDoc;
    return savedSession as NodeSavedSession;
  },
  async del(sub: string): Promise<void> {
    await OAuthSession.deleteOne({ sub });
  },
};
