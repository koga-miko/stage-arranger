const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const cors = require("cors");

if (!process.env.PORT) {
  app.use(
    cors({
      origin: "http://localhost:3000",
    })
  );
}
app.use(express.json());

const routes = require("express").Router();
app.use("/api/v1", routes);
routes.use("/auth", require("./src/v1/routes/auth"));
routes.use("/record", require("./src/v1/routes/record"));
app.use(
  "/static",
  express.static(path.join(__dirname, "./frontend/build/static"))
);
app.get("/logo192.png", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/logo192.png"));
});
app.get("/logo512.png", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/logo512.png"));
});
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/favicon.ico"));
});
app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/manifest.json"));
});
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/build/index.html"));
});

//Edgeの自動起動
const { execSync } = require("child_process");
execSync(
  "start microsoft-edge:http://localhost:8888",
  (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  }
);

//DB接続
try {
  mongoose.connect(process.env.MONGODB_URL);
  console.log("DBと接続中");
} catch {
  console.log(error);
}

app.listen(PORT, () => {
  console.log(`ローカルサーバー起動中・・・PORT=${PORT}`);
});
