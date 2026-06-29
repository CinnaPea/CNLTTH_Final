import { useState } from 'react'
import examImage from '../assets/landing/exam.webp'
import rollcallImage from '../assets/landing/rollcall.jpg'
import roomingImage from '../assets/landing/rooming.jpg'
import seatingImage from '../assets/landing/seating.png'

const tileImages = {
  'landing-tile__visual--exams': examImage,
  'landing-tile__visual--rooms': roomingImage,
  'landing-tile__visual--seating': seatingImage,
  'landing-tile__visual--attendance': rollcallImage,
}

function FeaturesSection({ featurePanels }) {
  const [activePanel, setActivePanel] = useState(null)

  function closeOverlay() {
    setActivePanel(null)
  }

  return (
    <section className="landing-workflows" id="landing-workflows">
      <div className="landing-workflows__heading">
        <h2>Các vận hành chính</h2>
        <p>
          Từ lúc tạo kỳ thi đến khi hoàn tất điểm danh, mỗi bước được trình bày như một khu vực thao tác riêng để đối quản lý và theo dõi.
        </p>
      </div>

      <div className="landing-tile-grid">
        {featurePanels.map((panel) => (
          <button className="landing-tile" key={panel.kicker} onClick={() => setActivePanel(panel)} type="button">
            <span className={`landing-tile__visual ${panel.visual}`} aria-hidden="true">
              <img alt="" src={tileImages[panel.visual]} />
              <span>{panel.kicker}</span>
            </span>
            <strong>
              {panel.title} 
            </strong>
          </button>
        ))}
      </div>

      {activePanel && (
        <div className="feature-overlay" onClick={closeOverlay}>
          <article
            aria-labelledby="feature-overlay-title"
            aria-modal="true"
            className="feature-overlay__card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button className="feature-overlay__close" onClick={closeOverlay} type="button">
              X
            </button>
            <div className="feature-overlay__media">
              <img alt="" src={tileImages[activePanel.visual]} />
              <span>{activePanel.kicker}</span>
            </div>
            <div className="feature-overlay__content">
              <p>Giới thiệu chức năng</p>
              <h3 id="feature-overlay-title">{activePanel.title}</h3>
              <p>{activePanel.text}</p>
              <ul>
                {activePanel.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default FeaturesSection
