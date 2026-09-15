const ENGINE_URL = "/engine/stockfish.js";
const SEARCH_TIMEOUT_MS = 30_000;

export class StockfishClient {
  constructor(onStatus) {
    this.onStatus = onStatus;
    this.worker = null;
    this.readyPromise = null;
    this.waiters = [];
    this.activeSearch = null;
    this.queuedSearch = null;
  }

  async analyze(fen, depth = 15) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const request = { fen, depth, resolve, reject, score: null };
      if (this.activeSearch) {
        this.cancelRequest(this.queuedSearch);
        this.queuedSearch = request;
        this.activeSearch.cancelled = true;
        this.worker.postMessage("stop");
        return;
      }
      this.startSearch(request);
    });
  }

  cancel() {
    this.cancelRequest(this.queuedSearch);
    this.queuedSearch = null;
    if (this.activeSearch) {
      this.activeSearch.cancelled = true;
      this.worker?.postMessage("stop");
    }
  }

  retry() {
    this.destroy();
    return this.ensureReady();
  }

  destroy() {
    this.cancelRequest(this.activeSearch);
    this.cancelRequest(this.queuedSearch);
    this.activeSearch = null;
    this.queuedSearch = null;
    this.waiters.forEach(({ reject }) => reject(new Error("Engine stopped")));
    this.waiters = [];
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
  }

  ensureReady() {
    if (this.readyPromise) return this.readyPromise;
    if (typeof WebAssembly !== "object" || typeof Worker !== "function") {
      return Promise.reject(new Error("This browser cannot run the chess engine."));
    }
    this.onStatus?.({ phase: "loading", progress: 0 });
    this.worker = new Worker(ENGINE_URL);
    this.worker.onmessage = ({ data }) => this.handleLine(data);
    this.worker.onerror = (event) => this.handleFailure(new Error(event.message || "The chess engine stopped unexpectedly."));
    if (typeof MessageChannel === "function") {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => {
        if (typeof data?.percent === "number") this.onStatus?.({ phase: "loading", progress: data.percent });
      };
      this.worker.addEventListener("message", (event) => {
        if (event.data === "info WillOutputEngineDownloadProgress") {
          event.stopImmediatePropagation();
          this.worker?.postMessage({ progressPort: channel.port2 }, [channel.port2]);
        }
      }, { once: true });
      this.worker.postMessage("setoption name CanOutputEngineDownloadProgress");
    }
    const readyPromise = this.initialize();
    this.readyPromise = readyPromise;
    readyPromise.catch((error) => {
      if (this.readyPromise === readyPromise) this.handleFailure(error);
    });
    return this.readyPromise;
  }

  async initialize() {
    this.worker.postMessage("uci");
    await this.waitFor((line) => line === "uciok", 20_000);
    this.worker.postMessage("isready");
    await this.waitFor((line) => line === "readyok", 20_000);
    this.worker.postMessage("setoption name Hash value 16");
    this.onStatus?.({ phase: "ready", progress: 1 });
  }

  startSearch(request) {
    this.activeSearch = request;
    this.onStatus?.({ phase: "thinking", progress: 1 });
    request.timeout = window.setTimeout(() => this.handleFailure(new Error("The engine took too long to respond.")), SEARCH_TIMEOUT_MS);
    this.worker.postMessage(`position fen ${request.fen}`);
    this.worker.postMessage(`go depth ${request.depth}`);
  }

  handleLine(data) {
    if (typeof data !== "string") return;
    const line = data.trim();
    this.waiters = this.waiters.filter((waiter) => {
      if (!waiter.match(line)) return true;
      window.clearTimeout(waiter.timeout);
      waiter.resolve(line);
      return false;
    });
    if (!this.activeSearch) return;
    const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
    if (scoreMatch) this.activeSearch.score = { type: scoreMatch[1], value: Number(scoreMatch[2]) };
    if (!line.startsWith("bestmove")) return;

    const completed = this.activeSearch;
    window.clearTimeout(completed.timeout);
    this.activeSearch = null;

    const moveMatch = line.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
    if (!moveMatch) {
      if (completed.cancelled) completed.reject(createAbortError());
      else completed.reject(new Error("The engine returned no legal move."));
      if (this.queuedSearch) {
        const next = this.queuedSearch;
        this.queuedSearch = null;
        this.startSearch(next);
      }
      return;
    }

    if (completed.cancelled) completed.reject(createAbortError());
    else completed.resolve({
      bestMove: { from: moveMatch[1], to: moveMatch[2], promotion: moveMatch[3] },
      score: completed.score ?? { type: "cp", value: 0 },
    });
    if (this.queuedSearch) {
      const next = this.queuedSearch;
      this.queuedSearch = null;
      this.startSearch(next);
    }
  }

  waitFor(match, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = { match, resolve, reject };
      waiter.timeout = window.setTimeout(() => {
        this.waiters = this.waiters.filter((item) => item !== waiter);
        reject(new Error("The chess engine could not be initialized."));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  handleFailure(error) {
    this.onStatus?.({ phase: "error", progress: 0, message: error.message });
    this.cancelRequest(this.activeSearch, error);
    this.cancelRequest(this.queuedSearch, error);
    this.activeSearch = null;
    this.queuedSearch = null;
    this.waiters.forEach((waiter) => {
      window.clearTimeout(waiter.timeout);
      waiter.reject(error);
    });
    this.waiters = [];
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
  }

  cancelRequest(request, error = createAbortError()) {
    if (!request) return;
    window.clearTimeout(request.timeout);
    request.reject(error);
  }
}

function createAbortError() {
  return new DOMException("Engine request cancelled", "AbortError");
}
