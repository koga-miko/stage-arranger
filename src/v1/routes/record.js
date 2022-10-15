const router = require("express").Router();
const recordController = require("../controllers/record");
const tokenHandler = require("../handlers/tokenHandler");

//レコードを作成
router.post("/", tokenHandler.verifyToken, recordController.create);

//ログインしているユーザーが投降したレコードをすべて取得
router.get("/", tokenHandler.verifyToken, recordController.getAll);

//ログインしているユーザーが投降したレコードを１つ取得
router.get("/:recordId", tokenHandler.verifyToken, recordController.getOne);

//ログインしているユーザーが投降したレコードを１つ更新
router.put("/:recordId", tokenHandler.verifyToken, recordController.update);

//ログインしているユーザーが投降したレコードを１つコピー
router.post("/:recordId", tokenHandler.verifyToken, recordController.copy);

//ログインしているユーザーが投降したレコードを１つ削除
router.delete("/:recordId", tokenHandler.verifyToken, recordController.delete);

module.exports = router;
