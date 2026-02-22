import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function HealthCheck({ healthy, errorMessage }) {
    return (_jsxs("div", { className: `health-check ${healthy ? 'healthy' : 'unhealthy'}`, children: [_jsx("span", { className: "status-icon", children: healthy ? '✓' : '✗' }), _jsx("span", { className: "status-text", children: healthy ? 'Healthy' : `Error: ${errorMessage || 'Unknown'}` })] }));
}
