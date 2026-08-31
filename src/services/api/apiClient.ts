import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const API_BASE_URL = 'http://192.168.1.9:8080';

type TokenProvider = () => string | null | Promise<string | null>;

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
  data?: T;
};

let inMemoryToken: string | null = null;
let tokenProvider: TokenProvider | null = null;
let unauthorizedHandler: (() => void) | null = null;

export class ApiClientError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
  isAuthError: boolean;

  constructor(options: {
    message: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
    isAuthError?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isAuthError = Boolean(options.isAuthError);
  }
}

export const setAuthToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const setTokenProvider = (provider: TokenProvider | null): void => {
  tokenProvider = provider;
};

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

const getCurrentToken = async (): Promise<string | null> => {
  if (tokenProvider) {
    return tokenProvider();
  }

  return inMemoryToken;
};

const isEnvelope = <T>(data: unknown): data is ApiEnvelope<T> => {
  if (!data || typeof data !== 'object') return false;
  const target = data as Record<string, unknown>;
  return (
    'success' in target ||
    'message' in target ||
    'error' in target ||
    'code' in target ||
    'data' in target
  );
};

const getMessageFromUnknown = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const target = data as Record<string, unknown>;
  const message = target.message;
  const error = target.error;

  if (typeof message === 'string' && message.trim()) return message;
  if (typeof error === 'string' && error.trim()) return error;
  return undefined;
};

const mapStatusToMessage = (status?: number): string => {
  if (status === 401)
    return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu';
  if (status === 422) return 'Dữ liệu gửi lên không hợp lệ';
  if (status && status >= 500) return 'Máy chủ đang bận, vui lòng thử lại sau';
  return 'Không thể xử lý yêu cầu';
};

const summarizePayload = (payload: unknown): unknown => {
  if (payload instanceof FormData) {
    return '[FormData]';
  }

  if (payload && typeof payload === 'object' && 'imageBase64' in payload) {
    const target = payload as Record<string, unknown>;
    return {
      ...target,
      imageBase64:
        typeof target.imageBase64 === 'string'
          ? `[base64:${target.imageBase64.length}]`
          : '[base64]',
    };
  }

  return payload;
};

const logRequest = (config: AxiosRequestConfig): void => {
  const method = (config.method || 'GET').toUpperCase();
  const url = `${config.baseURL || ''}${config.url || ''}`;
  console.log('[API][REQ]', method, url, {
    params: config.params,
    data: summarizePayload(config.data),
  });
};

const logResponse = (response: {
  status: number;
  config: AxiosRequestConfig;
  data: unknown;
}): void => {
  const method = (response.config.method || 'GET').toUpperCase();
  const url = `${response.config.baseURL || ''}${response.config.url || ''}`;
  console.log('[API][RES]', method, url, response.status, response.data);
};

const logError = (error: AxiosError): void => {
  const method = (error.config?.method || 'GET').toUpperCase();
  const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
  console.log('[API][ERR]', method, url, {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    data: error.response?.data,
  });
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  const token = await getCurrentToken();

  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  logRequest(config);
  return config;
});

apiClient.interceptors.response.use(
  response => {
    logResponse(response);

    if (isEnvelope(response.data) && response.data.success === false) {
      throw new ApiClientError({
        message:
          response.data.message || response.data.error || 'Yêu cầu thất bại',
        statusCode: response.status,
        code: response.data.code,
        details: response.data,
      });
    }

    return response;
  },
  error => {
    if (axios.isAxiosError(error)) {
      logError(error);

      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      const responseMessage = getMessageFromUnknown(responseData);
      const isAuthError = statusCode === 401 || statusCode === 403;

      if (isAuthError && unauthorizedHandler) {
        unauthorizedHandler();
      }

      throw new ApiClientError({
        message:
          responseMessage ||
          (error.code === 'ECONNABORTED'
            ? 'Yêu cầu quá thời gian chờ'
            : mapStatusToMessage(statusCode)),
        statusCode,
        code: error.code,
        details: responseData,
        isAuthError,
      });
    }

    throw new ApiClientError({
      message: 'Lỗi không xác định khi gọi API',
      details: error,
    });
  },
);

export const requestApi = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T | ApiEnvelope<T>> = await apiClient.request(
    config,
  );
  const responseData = response.data;

  if (isEnvelope<T>(responseData)) {
    if (typeof responseData.data !== 'undefined') {
      return responseData.data;
    }

    return responseData as unknown as T;
  }

  return responseData as T;
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof ApiClientError) {
    return error.message || fallbackMessage;
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = (error.response?.data as { message?: string })
      ?.message;
    return responseMessage || error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
