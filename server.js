const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const routes = require("./routes");

dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === "production") app.use(express.static("./client/build"));

app.use(routes);

app.listen(PORT, () => console.log(`Server is listening on http://localhost:${PORT}`));
