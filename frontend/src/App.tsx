import { useEffect, useState } from 'react'
import { DataConfig } from './types/data'
import ItemCard from './components/ItemCard'
import HealthCheck from './components/HealthCheck'
import './App.css'

function App() {
  const [data, setData] = useState<DataConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/data.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const json = await response.json() as DataConfig
        setData(json)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data'
        setError(message)
        console.error('Failed to load data.json:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Glaze Graph</h1>
        <HealthCheck healthy={!error && !loading} errorMessage={error || undefined} />
      </header>

      <main className="app-main">
        {loading && (
          <div className="loading-state">
            <p>Loading data...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <p className="hint">
              Make sure <code>/data/data.json</code> exists and is valid JSON.
            </p>
          </div>
        )}

        {!loading && !error && data?.links && (
          <div className="items-grid">
            {data.links.map(item => (
              <ItemCard key={item.itemId} item={item} />
            ))}
          </div>
        )}

        {!loading && !error && !data?.links && (
          <div className="empty-state">
            <p>No items found in data.json</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
