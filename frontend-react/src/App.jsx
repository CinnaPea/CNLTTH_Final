import { useEffect, useState } from 'react'
import AppShell from './components/app-shell/AppShell'
import { getAuthSession } from './api/authClient'
import { roleNavAccess } from './data/operationsMockData'
import BackToTop from './components/BackToTop'
import DetailSection from './components/DetailSection'
import FeaturesSection from './components/FeaturesSection'
import HeroSection from './components/HeroSection'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import SiteFooter from './components/SiteFooter'
import SiteHeader from './components/SiteHeader'
import SummarySection from './components/SummarySection'
import {
  detailSections,
  featurePanels,
  navItems,
  orbitNodes,
  summaryBlocks,
} from './data/landingContent'
import AttendancePage from './pages/AttendancePage'
import AccountPage from './pages/AccountPage'
import CandidatesPage from './pages/CandidatesPage'
import DashboardPage from './pages/DashboardPage'
import ExamsPage from './pages/ExamsPage'
import RegistrationsPage from './pages/RegistrationsPage'
import RoomAssignmentPage from './pages/RoomAssignmentPage'
import RoomsPage from './pages/RoomsPage'
import SeatAssignmentPage from './pages/SeatAssignmentPage'
import SubjectsPage from './pages/SubjectsPage'

const appPages = {
  '#dashboard': DashboardPage,
  '#subjects': SubjectsPage,
  '#exams': ExamsPage,
  '#registrations': RegistrationsPage,
  '#rooms': RoomsPage,
  '#candidates': CandidatesPage,
  '#room-assignment': RoomAssignmentPage,
  '#seat-assignment': SeatAssignmentPage,
  '#attendance': AttendancePage,
  '#account': AccountPage,
}

function App() {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [hash, setHash] = useState(window.location.hash || '#top')

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 220)
    const handleHashChange = () => setHash(window.location.hash || '#top')

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  if (hash === '#login') {
    return <LoginPage />
  }

  if (hash === '#signup') {
    return <SignupPage />
  }

  const AppPage = appPages[hash]

  if (AppPage) {
    const session = getAuthSession()

    if (!session) {
      return <LoginPage />
    }

    const roleName = session.user?.TenVaiTro
    const allowedHashes = roleNavAccess[roleName] || roleNavAccess.SinhVien
    const safeHash = allowedHashes.includes(hash) ? hash : '#dashboard'
    const SafeAppPage = appPages[safeHash]

    return (
      <AppShell currentHash={safeHash}>
        <SafeAppPage />
      </AppShell>
    )
  }

  return (
    <main className="landing-page" id="top">
      <SiteHeader navItems={navItems} />
      <HeroSection orbitNodes={orbitNodes} />

      <div className="page-container landing-content">
        <SummarySection summaryBlocks={summaryBlocks} />
        <FeaturesSection featurePanels={featurePanels} />
        <DetailSection detailSections={detailSections} />
      </div>

      <SiteFooter />
      <BackToTop isVisible={showBackToTop} />
    </main>
  )
}

export default App
