import authApi from "../api/authApi"
const authUtils = {
  // JWTチェック
  isAuthenticated : async () => {
    const token = localStorage.getItem("token");
    if(!token) return;

    try {
      const res = await authApi.verifyToken();
      return res.user;
    } catch {
      return false;
    }
  }
}

export default authUtils;