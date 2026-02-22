import { useState } from 'react'
import { GlazeItem } from '../types/data'
import { getItemImageUrl } from '../utils'
import GlazeDisplay from './GlazeDisplay'

interface Props {
  item: GlazeItem
}

export default function ItemCard({ item }: Props) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getItemImageUrl(item.itemId)

  return (
    <article className="item-card">
      <div className="item-header">
        <h3>{item.item}</h3>
        {item.temperature && (
          <span className="temperature">{item.temperature}</span>
        )}
      </div>

      <p className="description">{item.description}</p>

      <div className="item-image-container">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={item.item}
            className="item-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-placeholder">
            Item image not found: {item.itemId}
          </div>
        )}
      </div>

      <div className="glazes-section">
        <h4>Glazes</h4>
        <div className="glazes-grid">
          {item.glaze.map(glaze => (
            <GlazeDisplay key={glaze} glazeName={glaze} />
          ))}
        </div>
      </div>
    </article>
  )
}
