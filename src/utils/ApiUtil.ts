import axios from 'axios';

const api = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const handleRequestError = (error: unknown) => {
  console.log('API request failed:', error);
  throw error;
};

export default {
  getWithoutToken: async (url: string, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        handleRequestError(error);
      }
    }
  },

  postWithoutToken: async (url: string, data = {}) => {
    console.log({ endpoint: url });
    try {
      const response = await api.post(`${url}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        handleRequestError(error);
      }
    }
  },

  putWithoutToken: async (url: string, data = {}) => {
    console.log({ endpoint: url });
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        handleRequestError(error);
      }
    }
  },

  deleteWithoutToken: async (url: string) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        handleRequestError(error);
      }
    }
  }
};
