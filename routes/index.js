const path = require("path");
const router = require("express").Router();
const getAnalysis = require("../utils/get-analysis");

router.get("/analysis", async (req, res) => {
  const {
    query: { fen, depth = 15 },
  } = req;

  if (!fen) {
    const error = {
      error: "Invalid FEN passed",
    };

    res.status(500);
		res.json(error);
		return;
  }

  console.log('here abcd')
  try {
    const analysis = await getAnalysis(fen, depth);

    return res.json(analysis);
  } 
  catch(e) {
    console.log(e);
    res.status(500);
		res.json(e.toString());
		return;
  }
});

router.use((req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

module.exports = router;
