function normalizeBaseUrl(value, fallback) {
    const text = String(value || "").trim();
    if(!text || text.includes("<") || text.includes(">")) return fallback;
    return text.replace(/\/$/, "");
}

const RUBY_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_RUBY_API_BASE_URL, "http://localhost:3000/api/v1");
const CSHARP_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_CSHARP_API_BASE_URL, "http://localhost:5014/api/v1");

export const API_BASE_URLS = {
    ruby: RUBY_API_BASE_URL,
    csharp: CSHARP_API_BASE_URL,
};

async function req(baseURL, path, options = {}) {
    const url = `${baseURL}${path}`;
    const method = options.method || "GET";
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if(method !== "GET" && !headers["Idempotency-Key"]) {
        headers["Idempotency-Key"] = `examflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const cfg = {
        method,
        headers,
    };
    if(options.body !== undefined) {
        cfg.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, cfg);
    let data = null;
    const txt = await res.text();
    if(txt) {
        try {
            data = JSON.parse(txt);
        } catch {
            data = txt;
        }
    }
    if(!res.ok) {
        const msg = data?.error || data?.msg || `${res.status}`;
        const error = new Error(msg);
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return data;
}

export const rubyAPI = {
    get(path) {
        return req(RUBY_API_BASE_URL, path);
    },
    post(path, body) {
        return req(RUBY_API_BASE_URL, path, { method: "POST", body });
    },
    patch(path, body) {
        return req(RUBY_API_BASE_URL, path, { method: "PATCH", body });
    },
    delete(path) {
        return req(RUBY_API_BASE_URL, path, { method: "DELETE" });
    },
};

export const csharpAPI = {
    get(path) {
        return req(CSHARP_API_BASE_URL, path);
    },
    post(path, body) {
        return req(CSHARP_API_BASE_URL, path, { method: "POST", body });
    },
    patch(path, body) {
        return req(CSHARP_API_BASE_URL, path, { method: "PATCH", body });
    },
    delete(path) {
        return req(CSHARP_API_BASE_URL, path, { method: "DELETE" });
    },
};
