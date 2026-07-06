import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

let testEnv;

export async function setupEmulator() {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-glotr",
    firestore: {
      host: "localhost",
      port: 8080
    }
  });

  return testEnv;
}

export async function getTestEnv() {
  if (!testEnv) {
    testEnv = await setupEmulator();
  }
  return testEnv;
}

export async function cleanupEmulator() {
  if (testEnv) {
    await testEnv.cleanup();
  }
}

