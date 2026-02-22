export const getItemImageUrl = (itemId: string): string =>
  `/data/images/items/${itemId}.jpg`

export const getGlazeImageUrl = (glazeName: string): string => {
  const normalized = glazeName.replace(/\s+/g, '_')
  return `/data/images/glazes/${normalized}.jpg`
}
