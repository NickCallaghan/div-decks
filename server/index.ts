import express from "express";
import cors from "cors";
import { createPresentationsRouter } from "./routes/presentations.js";
import path from "node:path";

const app = express();
const PORT = 3001;

app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.text({ type: "text/html", limit: "10mb" }));
app.use(express.json());

// Serve presentation files statically for iframe src
const presentationsDir = path.resolve(
  import.meta.dirname,
  "..",
  "presentations",
);
app.use("/presentations", express.static(presentationsDir));

app.use("/api/presentations", createPresentationsRouter(presentationsDir));

app.listen(PORT, () => {
  console.log(`div.deck server running on http://localhost:${PORT}`);
});
