function SummarySection({ summaryBlocks }) {
  return (
    <section className="landing-intro">
      <div className="landing-intro__heading">
        <p>ExamFlow</p>
        <h2>Điều phối kỳ thi rõ ràng từ dữ liệu đến điểm danh</h2>
      </div>

      <div className="landing-intro__copy">
        <p>
          ExamFlow giúp đội vận hành chuẩn bị kỳ thi, phân phòng, xếp chỗ và ghi
          nhận điểm danh trong cùng một luồng làm việc dễ kiểm soát.
        </p>
        {summaryBlocks.map((block) => (
          <article className="landing-intro__note" key={block.title}>
            <h3>{block.title}</h3>
            <p>{block.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SummarySection
