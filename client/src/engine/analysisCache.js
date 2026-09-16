const DATABASE_NAME = "chess-analysis-v1";
const DATABASE_VERSION = 1;
const STORE_NAME = "positions";
const ENGINE_SIGNATURE = "stockfish-18-lite";
const MAX_ENTRIES = 2000;

let databasePromise;

export async function getCachedAnalysis({ fen, depth, skillLevel }) {
  try {
    const database = await openDatabase();
    return await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).get(createKey(fen, depth, skillLevel)));
  } catch {
    return null;
  }
}

export async function setCachedAnalysis({ fen, depth, skillLevel, result }) {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      key: createKey(fen, depth, skillLevel),
      result,
      createdAt: Date.now(),
    });
    await transactionComplete(transaction);
    trimCache(database);
  } catch {
    // Analysis still works when storage is disabled or full.
  }
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  if (!("indexedDB" in globalThis)) return Promise.reject(new Error("IndexedDB unavailable"));
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
      store.createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Analysis cache is blocked"));
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function trimCache(database) {
  try {
    const count = await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).count());
    const excess = count - MAX_ENTRIES;
    if (excess <= 0) return;
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const cursorRequest = transaction.objectStore(STORE_NAME).index("createdAt").openCursor();
    let removed = 0;
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor || removed >= excess) return;
      cursor.delete();
      removed += 1;
      cursor.continue();
    };
  } catch {
    // Trimming is best-effort and never blocks analysis.
  }
}

function createKey(fen, depth, skillLevel) {
  return `${ENGINE_SIGNATURE}|d${depth}|s${skillLevel}|${fen}`;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.result ?? request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
