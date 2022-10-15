const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 5000;
require("dotenv").config();
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

const routes = require("express").Router();
app.use("/api/v1", routes);
routes.use("/auth", require("./src/v1/routes/auth"));
routes.use("/record", require("./src/v1/routes/record"));

//DB接続
try {
  mongoose.connect(process.env.MONGODB_URL);
  console.log("DBと接続中");
} catch {
  console.log(error);
}

app.listen(PORT, () => {
  console.log("ローカルサーバー起動中・・・");
});
