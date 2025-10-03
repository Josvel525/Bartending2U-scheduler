(function (global) {
    const API = {};

    function buildError(message, cause) {
        const error = new Error(message);
        if (cause) {
            error.cause = cause;
        }
        return error;
    }

    async function parseJson(response) {
        const text = await response.text();
        try {
            return text ? JSON.parse(text) : {};
        } catch (error) {
            throw buildError('Invalid server response.', error);
        }
    }

    async function request(url, options) {
        const response = await fetch(url, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });

        const body = await parseJson(response);
        if (!response.ok || body.ok === false) {
            const message = body?.error?.message || `Request to ${url} failed.`;
            throw buildError(message);
        }

        return body.data;
    }

    API.getEmployees = function getEmployees() {
        return request('/api/employees');
    };

    API.getEmployee = function getEmployee(id) {
        if (!id) {
            return Promise.reject(buildError('Employee id is required.'));
        }
        return request(`/api/employees/${encodeURIComponent(id)}`);
    };

    global.B2UApi = Object.assign({}, global.B2UApi || {}, API);
})(window);
