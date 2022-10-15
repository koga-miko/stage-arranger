import { Button, TextField } from "@mui/material";
import React, { useState } from "react";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
const Login = () => {
  const navigate = useNavigate();
  const [usernameErrText, setUsernameErrText] = useState("");
  const [passwordErrText, setPasswordErrText] = useState("");
  const [loading, setLoading] = useState(false);

  const hundleSubmit = async (e) => {
    e.preventDefault();

    setUsernameErrText("");
    setPasswordErrText("");

    // 入力欄の文字列を取得
    const data = new FormData(e.target);
    const username = data.get("username").trim();
    const password = data.get("password").trim();

    let error = false;

    if (username === "") {
      error = true;
      setUsernameErrText("名前を入力してください");
    }
    if (password === "") {
      error = true;
      setPasswordErrText("パスワードを入力してください");
    }

    if (error) return;

    // setLoading(true);

    // 新規登録APIをたたく
    try {
      const res = await authApi.login({
        username,
        password,
      });
      localStorage.setItem("token", res.token);
      setLoading(false);
      // console.log("ログインに成功しました");
      navigate("/");
    } catch (err) {
      setLoading(false);
      console.log(`err.data.errors.param=${err.data.errors.param}`);
      console.log(`err.data.errors.msg=${err.data.errors.msg}`);
      const errors = err.response.data;
      if (errors.param === "username") {
        setUsernameErrText(errors.msg);
      }
      if (errors.param === "password") {
        setPasswordErrText(errors.msg);
      }
    }
  };
  return (
    <>
      <Box component="form" onSubmit={hundleSubmit} noValidate>
        <TextField
          fullWidth
          id="username"
          label="お名前"
          margin="normal"
          name="username"
          required
          helperText={usernameErrText}
          error={usernameErrText !== ""}
          disabled={loading}
        />
        <TextField
          fullWidth
          id="password"
          label="パスワード"
          margin="normal"
          name="password"
          type="password"
          required
          helperText={passwordErrText}
          error={passwordErrText !== ""}
          disabled={loading}
        />
        <LoadingButton
          xs={{ mt: 3, mb: 2 }}
          fullWidth
          type="submit"
          loading={loading}
          variant="outlined"
        >
          ログイン
        </LoadingButton>
      </Box>
      <Button component={Link} to="/register">
        アカウントを持っていませんか？新規登録
      </Button>
    </>
  );
};

export default Login;
