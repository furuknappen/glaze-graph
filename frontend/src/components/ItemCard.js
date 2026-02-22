import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { getItemImageUrl } from '../utils';
import GlazeDisplay from './GlazeDisplay';
export default function ItemCard({ item }) {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getItemImageUrl(item.itemId);
    return (_jsxs("article", { className: "item-card", children: [_jsxs("div", { className: "item-header", children: [_jsx("h3", { children: item.item }), item.temperature && (_jsx("span", { className: "temperature", children: item.temperature }))] }), _jsx("p", { className: "description", children: item.description }), _jsx("div", { className: "item-image-container", children: !imageError ? (_jsx("img", { src: imageUrl, alt: item.item, className: "item-image", onError: () => setImageError(true) })) : (_jsxs("div", { className: "image-placeholder", children: ["Item image not found: ", item.itemId] })) }), _jsxs("div", { className: "glazes-section", children: [_jsx("h4", { children: "Glazes" }), _jsx("div", { className: "glazes-grid", children: item.glaze.map(glaze => (_jsx(GlazeDisplay, { glazeName: glaze }, glaze))) })] })] }));
}
