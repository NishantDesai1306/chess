const { Engine } = require("@lubert/node-uci-engine");
const { resolve } = require('path');

const getAnalysis = (fen, depth = 15) => {
  return new Promise((res, rej) => {
    if (!process.env.ENGINE_PATH) {
      const error = {
        error: "Please set ENGINE_PATH env variable",
      };
  
      rej(error);
      return;
    }

    const engine = new Engine(resolve(process.env.ENGINE_PATH));

    engine.analyzePosition({ fen }, { depth }, ({ analysis, bestMove }) => {
      const { score } = analysis;

      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2);
      const result = {
        score: {
          type: score?.type ?? "",
          value: score?.value ?? -1,
        },
        bestMove: {
          from,
          to,
        },
      };

      res(result);
    });
  });
}

module.exports = getAnalysis;