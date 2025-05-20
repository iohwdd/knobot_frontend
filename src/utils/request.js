import axios from 'axios';

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
    // 在发送请求前可以做一些处理，比如添加请求头等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 请求失败时的处理
    const originalRequest = error.config;

    // 如果响应码是 401 (未授权)，可能是 token 过期
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果已经在刷新，则将请求加入队列中
        return new Promise((resolve) => {
          retryQueue.push(() => {
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 调用刷新 token 的接口
        const response = await axios.post('/api/user/refreshToken', null, {
          withCredentials: true, // 确保携带 cookie
        });

        // 刷新成功
        if (response.data.code === 200) {
          // 执行队列中的请求
          retryQueue.forEach((cb) => cb());
          retryQueue = [];

          // 重试原请求
          return request(originalRequest);
        } else {
          // 如果刷新 token 失败，可能需要跳转到登录页
          console.error('刷新 token 失败');
          window.location.href = '/';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('刷新 token 出错', refreshError);
        // 跳转到登录页
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default request;