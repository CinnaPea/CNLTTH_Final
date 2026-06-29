function DetailSection({ detailSections }) {
  return (
    <section className="landing-details">
      {detailSections.map((section) => (
        <article className="landing-detail" id={section.id} key={section.id}>
          <p>{section.label}</p>
          <h3>{section.title}</h3>
          <p>{section.text}</p>
        </article>
      ))}
    </section>
  )
}

export default DetailSection
