export const getItemImageUrl = (itemId) => `/data/images/items/${itemId}.jpg`;
export const getGlazeImageUrl = (glazeName) => {
    const normalized = glazeName.replace(/\s+/g, '_');
    return `/data/images/glazes/${normalized}.jpg`;
};
