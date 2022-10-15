import React, { useState } from "react";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import recordApi from "../api/recordApi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector} from "react-redux";
import { setRecord } from "../redux/features/recordSlice";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const records = useSelector((state) => state.record.value);
  const createRecord = async () => {
    try {
      setLoading(true);
      const res = await recordApi.create();
      const newRecords = [res, ...records];
      dispatch(setRecord(newRecords));
      setLoading(false);
      navigate(`/record/${res._id}`);
    } catch (err) {
      setLoading(false);
      alert(err);
    }
  };
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingButton
        variant="outlined"
        onClick={() => createRecord()}
        loading={loading}
      >
        最初のレイアウトを作成
      </LoadingButton>
    </Box>
  );
};

export default Home;
