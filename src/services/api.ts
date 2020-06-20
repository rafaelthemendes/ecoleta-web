import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import deepMapKeys from "deep-map-keys";
import _ from "lodash";

const requestHandler = (payload: AxiosRequestConfig) => {
  const result = payload;
  result.data = deepMapKeys(result.data, _.snakeCase);
  return result;
};

const responseHandler = (payload: AxiosResponse<any>) => {
  const result = payload;
  result.data = deepMapKeys(result.data, _.camelCase);
  return result;
};

const api = axios.create({
  baseURL: "http://localhost:3333",
});

api.interceptors.request.use(requestHandler);
api.interceptors.response.use(responseHandler);

export default api;
