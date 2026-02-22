interface Props {
  healthy: boolean
  errorMessage?: string
}

export default function HealthCheck({ healthy, errorMessage }: Props) {
  return (
    <div className={`health-check ${healthy ? 'healthy' : 'unhealthy'}`}>
      <span className="status-icon">{healthy ? '✓' : '✗'}</span>
      <span className="status-text">
        {healthy ? 'Healthy' : `Error: ${errorMessage || 'Unknown'}`}
      </span>
    </div>
  )
}
