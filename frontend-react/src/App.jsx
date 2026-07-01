import { useEffect, useState } from 'react'
import AppShell from './components/app-shell/AppShell'
import { getAuthSession } from './api/authClient'
import { canRoleAccessHash } from './data/roleAccess'
import BackToTop from './components/BackToTop'
import { ToastProvider } from './components/common/Toast'
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
import AuditLogPage from './pages/AuditLogPage'

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
  '#audit-log': AuditLogPage,
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
    const safeHash = canRoleAccessHash(roleName, hash) ? hash : '#dashboard'
    const SafeAppPage = appPages[safeHash]

    return (
      <ToastProvider>
        <AppShell currentHash={safeHash}>
          <SafeAppPage />
        </AppShell>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
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
    </ToastProvider>
  )
}

export default App
