  import axios from 'axios';
import { useUserStore } from '@/stores/user';

// 创建 axios 实例
const request = axios.create({
  timeout: 10000, // 请求超时时间
  withCredentials: true, // 允许携带 cookie
});

// 是否正在刷新 token
let isRefreshing = false;
// 重试队列，存储待重发请求的数组
let retryQueue = [];

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从Cookie中获取accessToken并添加到请求头
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 获取Cookie的辅助函数
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 排除不需要自动刷新token的接口
    const excludeUrls = [
      '/api/user/login',
      '/api/user/registry',
      '/api/user/refreshToken'
    ];
    if (excludeUrls.some(url => originalRequest.url && originalRequest.url.includes(url))) {
      return Promise.reject(error);
    }

    // 500服务器错误，尝试刷新token
    if (error.response && error.response.status === 500 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          retryQueue.push(() => {
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 创建一个新的axios实例来调用刷新token接口，避免触发拦截器
        const refreshResponse = await axios.post('/api/user/refreshToken', null, {
          withCredentials: true,
        });

        if (refreshResponse.data.code === 200) {
          // token刷新成功，重新处理队列中的请求
          retryQueue.forEach((cb) => cb());
          retryQueue = [];
          return request(originalRequest);
        } else {
          // 刷新失败，清理用户信息
          const userStore = useUserStore();
          userStore.clearUserInfo();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('刷新token失败:', refreshError);
        // 刷新token失败，清理用户信息
        const userStore = useUserStore();
        userStore.clearUserInfo();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default request;