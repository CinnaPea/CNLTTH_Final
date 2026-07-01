import { useState } from 'react'
import { authClient, saveAuthSession } from '../api/authClient'

function InputShell({ icon, name, onChange, onTogglePassword, placeholder, showPassword = false, type = 'text', value }) {
  const isPassword = type === 'password'

  return (
    <label className="form-field">
      <span>{icon}</span>
      <input
        autoComplete={isPassword ? 'current-password' : 'username'}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={isPassword && showPassword ? 'text' : type}
        value={value}
      />
      {isPassword ? (
        <button
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="password-toggle"
          onClick={onTogglePassword}
          type="button"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      ) : null}
    </label>
  )
}

function getFriendlyError(error) {
  if (error instanceof TypeError) {
    return 'Khong ket noi duoc dich vu dang nhap SQL va tai khoan khong khop du lieu seed.'
  }

  return error?.message || 'Dang nhap that bai. Vui long thu lai.'
}

function LoginPage() {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember: true,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function updateForm(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function submitLogin(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await authClient.login({
        identifier: form.identifier.trim(),
        email: form.identifier.trim(),
        password: form.password,
      })

      const savedSession = saveAuthSession(session, form.remember)
      window.location.hash = savedSession.user?.TenVaiTro === 'Admin' ? '#dashboard' : '#top'
    } catch (loginError) {
      setError(getFriendlyError(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-page--login">
      <div className="auth-container">
        <div className="auth-page__nav">
          <a className="button button--glass" href="#top">
            Back to landing page
          </a>
          <a className="auth-page__link" href="#signup">
            Chua co tai khoan?
          </a>
        </div>

        <section className="auth-card">
          <div className="auth-card__grid">
            <div className="auth-visual auth-visual--login">
              <div className="auth-visual__stripe auth-visual__stripe--wide" />
              <div className="auth-visual__stripe auth-visual__stripe--short" />
              <div className="auth-visual__mark">
                <span>e</span>
              </div>

              <div className="auth-visual__copy">
                <h1>Welcome</h1>
                <p>
                  Dang nhap de tiep tuc dieu phoi ky thi, theo doi phan phong, so do cho ngoi
                  va cap nhat diem danh trong cung mot he thong.
                </p>
              </div>
            </div>

            <div className="auth-form-panel">
              <form className="auth-form" onSubmit={submitLogin}>
                <p className="eyebrow">Login</p>
                <h2>Chao mung tro lai</h2>
                <p>
                  Dang nhap de truy cap khu vuc dieu hanh ky thi. Tai khoan cua ban se duoc
                  dung de quan ly phan phong, xep cho va diem danh.
                </p>

                <div className="auth-fields">
                  <InputShell
                    icon="@"
                    name="identifier"
                    onChange={updateForm}
                    placeholder="Ten dang nhap hoac email"
                    value={form.identifier}
                  />
                  <InputShell
                    icon="lock"
                    name="password"
                    onChange={updateForm}
                    onTogglePassword={() => setShowPassword((current) => !current)}
                    placeholder="Mat khau"
                    showPassword={showPassword}
                    type="password"
                    value={form.password}
                  />
                </div>

                <div className="auth-options">
                  <label>
                    <input
                      checked={form.remember}
                      name="remember"
                      onChange={updateForm}
                      type="checkbox"
                    />
                    <span>Ghi nho dang nhap</span>
                  </label>
                  <a href="#signup">Chua co tai khoan?</a>
                </div>

                {error && <p className="auth-message auth-message--error">{error}</p>}

                <button className="button button--auth" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Dang dang nhap...' : 'Dang nhap'}
                </button>

                <div className="auth-service-note">
                  Dung service <code>VITE_AUTH_API_BASE_URL</code>. Neu service chua chay, he thong dung tai khoan seed SQL demo.
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
