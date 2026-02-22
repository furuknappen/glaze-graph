export interface GlazeItem {
  itemId: string
  item: string
  description: string
  temperature: string
  glaze: string[]
}

export interface DataConfig {
  links: GlazeItem[]
}
