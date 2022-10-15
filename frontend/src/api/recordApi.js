import axiosClient from "./axiosClient";

const recordApi = {
  create: () => axiosClient.post("record"),
  getAll: () => axiosClient.get("record"),
  getOne: (id) => axiosClient.get(`record/${id}`),
  update: (id, params) => {
    axiosClient.post(`record/${id}`, params);
  },
  delete: (id) => axiosClient.delete(`record/${id}`),
};

export default recordApi;
