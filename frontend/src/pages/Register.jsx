import { Button, TextField } from "@mui/material";
import React, { useState } from "react";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
const Register = () => {
  const navigate = useNavigate();
  const [usernameErrText, setUsernameErrText] = useState("");
  const [passwordErrText, setPasswordErrText] = useState("");
  const [confirmPasswordErrText, setConfirmPasswordErrText] = useState("");
  const [loading, setLoading] = useState(false);

  const hundleSubmit = async (e) => {
    e.preventDefault();

    setUsernameErrText("");
    setPasswordErrText("");
    setConfirmPasswordErrText("");

    // 入力欄の文字列を取得
    const data = new FormData(e.target);
    const username = data.get("username").trim();
    const password = data.get("password").trim();
    const confirmPassword = data.get("confirmPassword").trim();

    let error = false;

    if (username === "") {
      error = true;
      setUsernameErrText("名前を入力してください");
    }
    if (password === "") {
      error = true;
      setPasswordErrText("パスワードを入力してください");
    }
    if (confirmPassword === "") {
      error = true;
      setConfirmPasswordErrText("確認用パスワードを入力してください");
    }
    if (password !== confirmPassword) {
      error = true;
      setConfirmPasswordErrText("パスワードと確認用パスワードが異なります");
    }

    if (error) return;

    setLoading(true);

    // 新規登録APIをたたく
    try {
      const res = await authApi.register({
        username,
        password,
        confirmPassword,
      });
      localStorage.setItem("token", res.token);
      navigate("/");
    } catch (err) {
      const errors = err.data.errors[0];
      if (errors.param === "username") {
        setUsernameErrText(errors.msg);
        setPasswordErrText("");
        setConfirmPasswordErrText("");
      }
      if (errors.param === "password") {
        setUsernameErrText("");
        setPasswordErrText(errors.msg);
        setConfirmPasswordErrText("");
      }
      if (errors.param === "confirmPassword") {
        setUsernameErrText("");
        setPasswordErrText("");
        setConfirmPasswordErrText(errors.msg);
      }
    } finally {
      setLoading(false);
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
        <TextField
          fullWidth
          id="confirmPassword"
          label="確認用パスワード"
          margin="normal"
          name="confirmPassword"
          type="password"
          required
          helperText={confirmPasswordErrText}
          error={confirmPasswordErrText !== ""}
          disabled={loading}
        />
        <LoadingButton
          xs={{ mt: 3, mb: 2 }}
          fullWidth
          type="submit"
          loading={loading}
          variant="outlined"
        >
          アカウント作成
        </LoadingButton>
      </Box>
      <Button component={Link} to="/login">
        既にアカウントを持っていますか？ログイン
      </Button>
    </>
  );
};

export default Register;
