const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  icon: {
    type: String,
    default: "📝",
  },
  title: {
    type: String,
    default: "無題",
  },
  subTitle: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  layoutInfo: {
    type: String,
    default: "",
  },
  favoritePosition: {
    type: Number,
  },
  position: {
    type: Number,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Record", recordSchema);
