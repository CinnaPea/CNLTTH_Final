const RUBY_API_BASE_URL = import.meta.env.VITE_RUBY_API_BASE_URL || "http://localhost:3000/api/v1";
const CSHARP_API_BASE_URL = import.meta.env.VITE_CSHARP_API_BASE_url || "http://localhost:5000/<Thay của Bảo Long vào>";

async function req(baseURL, path, options = {}) {
    const url = `${baseURL}${path}`;
    const cfg = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
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
        throw new Error(msg);
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
};