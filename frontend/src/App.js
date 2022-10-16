import "./App.css";
import Login from "./pages/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/layout/AuthLayout";
import Register from "./pages/Register";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { blue } from "@mui/material/colors";
import AppLayout from "./components/layout/AppLayout";
import Record from "./pages/Record";
import Home from "./pages/Home";
import Help from "./pages/Help";
function App() {
  const theme = createTheme({
    palette: { primary: blue },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="record" element={<Home />} />
            <Route path="record/:recordId" element={<Record />} />
          </Route>
          <Route path="help" element={<Help />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
