import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import ItemCard from './components/ItemCard';
import HealthCheck from './components/HealthCheck';
import './App.css';
function App() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/data/data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                setData(json);
                setError(null);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load data';
                setError(message);
                console.error('Failed to load data.json:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "Glaze Graph" }), _jsx(HealthCheck, { healthy: !error && !loading, errorMessage: error || undefined })] }), _jsxs("main", { className: "app-main", children: [loading && (_jsx("div", { className: "loading-state", children: _jsx("p", { children: "Loading data..." }) })), error && (_jsxs("div", { className: "error-state", children: [_jsx("h2", { children: "Error Loading Data" }), _jsx("p", { children: error }), _jsxs("p", { className: "hint", children: ["Make sure ", _jsx("code", { children: "/data/data.json" }), " exists and is valid JSON."] })] })), !loading && !error && data?.links && (_jsx("div", { className: "items-grid", children: data.links.map(item => (_jsx(ItemCard, { item: item }, item.itemId))) })), !loading && !error && !data?.links && (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No items found in data.json" }) }))] })] }));
}
export default App;
