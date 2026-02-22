import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { getGlazeImageUrl } from '../utils';
export default function GlazeDisplay({ glazeName }) {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getGlazeImageUrl(glazeName);
    return (_jsxs("div", { className: "glaze-display", children: [_jsx("h4", { children: glazeName }), _jsx("div", { className: "glaze-image-container", children: !imageError ? (_jsx("img", { src: imageUrl, alt: glazeName, className: "glaze-image", onError: () => setImageError(true) })) : (_jsxs("div", { className: "image-placeholder", children: ["Image not found: ", glazeName] })) })] }));
}
