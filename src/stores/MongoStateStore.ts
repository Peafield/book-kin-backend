import type {
  NodeSavedStateStore,
  NodeSavedState,
} from "@atproto/oauth-client-node";
import OAuthState from "../models/OAuthState";

export const mongoStateStore: NodeSavedStateStore = {
  async set(key: string, internalState: NodeSavedState): Promise<void> {
    await OAuthState.updateOne(
      { key },
      {
        $set: { ...internalState, key },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  },
  async get(key: string): Promise<NodeSavedState | undefined> {
    const stateDoc = await OAuthState.findOne({ key }).lean();
    if (!stateDoc) return undefined;

    const { _id, __v, key: docKey, createdAt, ...savedState } = stateDoc;
    return savedState as NodeSavedState;
  },

  async del(key: string): Promise<void> {
    await OAuthState.deleteOne({ key });
  },
};
