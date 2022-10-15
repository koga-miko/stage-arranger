const Record = require("../models/record");

exports.create = async (req, res) => {
  try {
    const recordCount = await Record.find().count();
    //　レコード新規作成
    const record = await Record.create({
      user: req.user._id,
      position: recordCount,
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getAll = async (req, res) => {
  try {
    const records = await Record.find({ user: req.user._id }).sort("-position");
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getOne = async (req, res) => {
  const { recordId } = req.params;
  try {
    const record = await Record.findOne({ user: req.user._id, _id: recordId });
    if (!record) {
      return res.status(404).json("レコードが存在しません");
    }
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.update = async (req, res) => {
  const { recordId } = req.params;
  const { title, subTitle, description, layoutInfo } = req.body;
  try {
    if (title === "") {
      req.body.title = "無題";
    }
    if (description === "") {
      req.body.description = "ここに自由に記入してください";
    }
    const record = await Record.findOne({ user: req.user._id, _id: recordId });
    if (!record) {
      return res.status(404).json("レコードが存在しません");
    }

    const updatedRecord = await Record.findByIdAndUpdate(recordId, {
      $set: req.body,
    });

    res.status(200).json(updatedRecord);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.delete = async (req, res) => {
  const { recordId } = req.params;
  try {
    const record = await Record.findOne({ user: req.user._id, _id: recordId });
    if (!record) {
      return res.status(404).json("レコードが存在しません");
    }
    await Record.deleteOne({ _id: recordId });
    res.status(200).json("メモを削除しました");
  } catch (err) {
    res.status(500).json(err);
  }
};
