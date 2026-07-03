import axios from "axios";
import { API_BASE_URL } from "./api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
export default axiosInstance;
