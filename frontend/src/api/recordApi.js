import axiosClient from "./axiosClient";

const recordApi = {
  create: () => axiosClient.post("record"),
  getAll: () => axiosClient.get("record"),
  getOne: (id) => axiosClient.get(`record/${id}`),
  update: (id, params) => axiosClient.put(`record/${id}`, params),
  copy: (id) => axiosClient.post(`record/${id}`),
  delete: (id) => axiosClient.delete(`record/${id}`),
};

export default recordApi;
