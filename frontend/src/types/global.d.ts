declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
    // Native Web API declarations for polyfills
    Request: typeof Request;
    Response: typeof Response;
    fetch: typeof fetch;
  }
  
  // Extend Fetch API types
  interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: any;
    mode?: RequestMode;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrer?: string;
    integrity?: string;
    keepalive?: boolean;
    signal?: AbortSignal;
  }
  
  interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }
  
  interface RequestInfo {
    [key: string]: any;
  }
}

export {};