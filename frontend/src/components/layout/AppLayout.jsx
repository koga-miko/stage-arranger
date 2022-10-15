import { Box } from "@mui/material";
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import authUtils from "../../utils/authUtils";
import Sidebar from "../common/Sidebar";
import { setUser } from "../../redux/features/userSlice";
import { useDispatch, useSelector } from "react-redux";

const AppLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const commonDisp = useSelector((state) => state.commonDisp.value);
  useEffect(() => {
    let isMounted = true;
    //JWT を持っているのか確認する
    const checkAuth = async () => {
      // 認証チェック
      const user = await authUtils.isAuthenticated();
      if (isMounted) {
        if (!user) {
          navigate("/login");
        } else {
          // ユーザーを保存する
          dispatch(setUser(user));
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate, dispatch]);

  const renderSidebar = () => {
    if (commonDisp.isSidebarOpened) {
      return <Sidebar />;
    }
    return <></>;
  };

  return (
    <div>
      <Box sx={{ display: "flex" }}>
        {renderSidebar()}
        <Box sx={{ flexGrow: 1, p: 1, width: "max-content" }}>
          <Outlet />
        </Box>
      </Box>
    </div>
  );
};

export default AppLayout;
