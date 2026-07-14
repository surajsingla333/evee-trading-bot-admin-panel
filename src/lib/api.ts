import axios from 'axios'
import { apiToken, apiUrl, useMockData } from '@/config/env'

export const api = axios.create({
  baseURL: apiUrl || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = apiToken || localStorage.getItem('stack_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stack_admin_token')
    }
    return Promise.reject(error)
  },
)

export function assertLiveApi() {
  if (useMockData) {
    throw new Error('Live API is disabled while VITE_APP_ENV=test')
  }
  if (!apiUrl) {
    throw new Error('VITE_API_URL is not configured')
  }
  if (!apiToken && !localStorage.getItem('stack_admin_token')) {
    throw new Error('VITE_API_TOKEN is not configured')
  }
}
