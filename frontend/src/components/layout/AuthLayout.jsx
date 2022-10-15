import { Box } from "@mui/material";
import { Container } from "@mui/system";
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import notionLogo from "../../assets/images/notion-logo.png";
import authUtils from "../../utils/authUtils";
const AuthLayout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    //JWT を持っているのか確認する
    const checkAuth = async () => {
      // 認証チェック
      const isAuth = await authUtils.isAuthenticated();
      if (isMounted) {
        if (isAuth) {
          navigate("/");
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  return (
    <div>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {/* <img
            src={notionLogo}
            alt=""
            style={{ width: 100, height: 100, marginBottom: 3 }}
          /> */}
          <h1>SA</h1>
          Stage Arranger
        </Box>
        <Outlet />
      </Container>
    </div>
  );
};

export default AuthLayout;
