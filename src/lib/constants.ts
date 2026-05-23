// API 基础地址
export const API_BASE = typeof window !== 'undefined' 
  ? (localStorage.getItem('api_base') || 'http://129.226.220.194:5000/api')
  : 'http://129.226.220.194:5000/api';