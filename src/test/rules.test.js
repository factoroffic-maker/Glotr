import { describe, it, expect } from "vitest";
import { getTestEnv } from "./firebaseEmulator";

describe("Firestore Rules", () => {
  it("initializes emulator", async () => {
    const env = await getTestEnv();
    expect(env).toBeDefined();
  });

  it("rejects unauthenticated writes", async () => {
    const env = await getTestEnv();
    const db = env.unauthenticatedContext().firestore();

    await expect(
      db.collection("posts").add({ text: "test" })
    ).rejects.toBeDefined();
  });
});
