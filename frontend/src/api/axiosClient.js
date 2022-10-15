import axios from "axios";

let server_url = "http://localhost:5000/api/v1/";
if (process.env.NODE_ENV === "production") {
  server_url = "https://stage-arranger.herokuapp.com/api/v1/"; // for Heroku
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
