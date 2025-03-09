import axios from "axios";

let server_url = "http://localhost:5000/api/v1/";
if (process.env.NODE_ENV === "production") {
  //  server_url = "https://stage-arranger.herokuapp.com/api/v1/"; // for Heroku
  // server_url = "http://localhost:8888/api/v1/"; // for local-server
  server_url =
    "https://098e-2400-2650-2222-ce00-c0a-8361-58fd-63bc.ngrok-free.app/api/v1/"; // for local-server via ngrok
}
const getToken = () => localStorage.getItem("token");
const axiosClient = axios.create({
  baseURL: server_url,
});

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
