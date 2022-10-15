import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Typography,
} from "@mui/material";
import LogoutOutLinedIcon from "@mui/icons-material/LoginOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import React, { useEffect, useState } from "react";
import assets from "../../assets/index";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import recordApi from "../../api/recordApi";
import { setRecord } from "../../redux/features/recordSlice";

const Sidebar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const user = useSelector((state) => state.user.value);
  const records = useSelector((state) => state.record.value);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    // console.log("useEeffect getAll! on [dispatch]")
    const getRecords = async () => {
      try {
        const res = await recordApi.getAll();
        dispatch(setRecord(res));
      } catch (err) {
        alert(err);
      }
    };
    getRecords();
  }, [dispatch]);

  useEffect(() => {
    const activeIndex = records.findIndex((e) => e._id === recordId);
    setActiveIndex(activeIndex);
  }, [navigate, records, recordId]);

  const addRecord = async () => {
    try {
      const res = await recordApi.create();
      const newRecords = [res, ...records];
      dispatch(setRecord(newRecords));
      navigate(`/record/${res._id}`);
    } catch (err) {
      alert(err);
    }
  };
  return (
    <Drawer
      container={window.document.body}
      variant="permanent"
      open={true}
      sx={{ width: 360, height: "100vh" }}
    >
      <List
        sx={{
          width: 360,
          height: "100vh",
          backgroundColor: assets.colors.secondary,
        }}
      >
        <ListItemButton>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "base-between",
            }}
          >
            <Typography variant="body2" fontWeight="700">
              {user.username}
            </Typography>
            <IconButton onClick={logout}>
              <LogoutOutLinedIcon />
            </IconButton>
          </Box>
        </ListItemButton>
        <Box sx={{ paddingTop: "10px" }}></Box>
        <ListItemButton>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "base-between",
            }}
          >
            <Typography variant="body2" fontWeight="700">
              お気に入り
            </Typography>
            <IconButton></IconButton>
          </Box>
        </ListItemButton>
        <Box sx={{ paddingTop: "10px" }}></Box>
        <ListItemButton>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "base-between",
            }}
          >
            <Typography variant="body2" fontWeight="700">
              プライベート
            </Typography>
            <IconButton onClick={(e) => addRecord(e)}>
              <AddBoxOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </ListItemButton>
        {records.map((item, index) => (
          <ListItemButton
            sx={{ pl: "20px" }}
            component={Link}
            to={`/record/${item._id}`}
            key={item._id}
            selected={index === activeIndex}
          >
            <Typography>
              {/* {item.icon} */}
              {item.title}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
