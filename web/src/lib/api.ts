import axios from "axios"

const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
