import { Box, Typography } from "@mui/material";
import React from "react";
import { useState } from "react";
import Picker from "@emoji-mart/react";
const EmojiPicker = (props) => {
  const [isShowPicker, setIsShowPicker] = useState(false);
  const showPicker = () => setIsShowPicker(!isShowPicker);
  const selectEmoji = (e) => {
    const emojiCode = e.unified.split("-");
    let codesArray = [];
    emojiCode.forEach((el) => codesArray.push("0x" + el));
    // console.log(codesArray);
    const emoji = String.fromCodePoint(...codesArray);
    // console.log(emoji);
    setIsShowPicker(false);
    props.onChange(emoji);
  };
  return (
    <Box>
      <Typography
        variant="h3"
        fontWeight="700"
        sx={{ cursor: "pointer" }}
        onClick={showPicker}
      >
        {props.icon}
      </Typography>
      <Box
        sx={{
          display: isShowPicker ? "block" : "none",
          position: "absolute",
          zIndex: "100",
        }}
      >
        <Picker onEmojiSelect={selectEmoji} />
      </Box>
    </Box>
  );
};

export default EmojiPicker;
