import axios from "axios";

// デフォルトURL（config.jsonが読み込めない場合のフォールバック）
let server_url = "http://localhost:5000/api/v1/";

const getToken = () => localStorage.getItem("token");

// axiosインスタンスを作成（初期はデフォルトURL）
const axiosClient = axios.create({
  baseURL: server_url,
});

// 本番環境では、public/config.jsonから実行時にURLを読み込んでbaseURLを更新
if (process.env.NODE_ENV === "production") {
  fetch("/config.json")
    .then((response) => response.json())
    .then((config) => {
      const activeKey = config.activeUrl || "ngrok";
      const configuredUrl = config.apiUrls[activeKey];
      if (configuredUrl) {
        axiosClient.defaults.baseURL = configuredUrl;
        console.log(`API URL loaded from config.json: ${configuredUrl} (${activeKey})`);
      }
    })
    .catch((error) => {
      console.warn("Failed to load config.json, using default URL:", error);
    });
}

//APIをたたく前に前処理を行う
axiosClient.interceptors.request.use(async (config) => {
  return {
    ...config,
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getToken()}`, //リクエストヘッダにJWTをつけてサーバーに渡す
    },
  };
});

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (err) => {
    throw err.response;
  }
);

export default axiosClient;
