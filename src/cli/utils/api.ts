import axios from "axios";

export const api = axios.create({
  baseURL: process.env.QG_API_URL || "http://localhost:3001",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
