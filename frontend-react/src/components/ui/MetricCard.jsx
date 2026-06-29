function MetricCard({ label, value, tone = 'blue' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

export default MetricCard
