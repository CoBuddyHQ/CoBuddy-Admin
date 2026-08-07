import axiosInstance from 'axios';

// Base Axios instance
const axios = axiosInstance.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
axios.interceptors.request.use((config) => {
  // const token = localStorage.getItem('admin_token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default axios;
