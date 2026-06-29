function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

export default PageHeader
