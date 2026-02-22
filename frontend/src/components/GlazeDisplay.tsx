import { useState } from 'react'
import { getGlazeImageUrl } from '../utils'

interface Props {
  glazeName: string
}

export default function GlazeDisplay({ glazeName }: Props) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getGlazeImageUrl(glazeName)

  return (
    <div className="glaze-display">
      <h4>{glazeName}</h4>
      <div className="glaze-image-container">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={glazeName}
            className="glaze-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-placeholder">
            Image not found: {glazeName}
          </div>
        )}
      </div>
    </div>
  )
}
