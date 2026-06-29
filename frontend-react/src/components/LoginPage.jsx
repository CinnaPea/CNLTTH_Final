import { useState } from 'react'
import { authClient, saveAuthSession } from '../api/authClient'

function InputShell({ icon, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="form-field">
      <span>{icon}</span>
      <input
        autoComplete={type === 'password' ? 'current-password' : 'username'}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  )
}

function getFriendlyError(error) {
  if (error instanceof TypeError) {
    return 'Không kết nối được dịch vụ đăng nhập SQL và tài khoản không khớp dữ liệu seed.'
  }

  return error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
}

function LoginPage() {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember: true,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            ← Về landing page
          </a>
          <a className="auth-page__link" href="#signup">
            Chưa có tài khoản?
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
                  Đăng nhập để tiếp tục điều phối kỳ thi, theo dõi phân phòng,
                  sơ đồ chỗ ngồi và cập nhật điểm danh trong cùng một hệ thống.
                </p>
              </div>
            </div>

            <div className="auth-form-panel">
              <form className="auth-form" onSubmit={submitLogin}>
                <p className="eyebrow">Login</p>
                <h2>Chào mừng trở lại</h2>
                <p>
                  Đăng nhập để truy cập khu vực điều hành kỳ thi. Tài khoản của
                  bạn sẽ được dùng để quản lý phân phòng, xếp chỗ và điểm danh.
                </p>

                <div className="auth-fields">
                  <InputShell
                    icon="👤"
                    name="identifier"
                    onChange={updateForm}
                    placeholder="Tên đăng nhập hoặc email"
                    value={form.identifier}
                  />
                  <InputShell
                    icon="🔒"
                    name="password"
                    onChange={updateForm}
                    placeholder="Mật khẩu"
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
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#signup">Chưa có tài khoản?</a>
                </div>

                {error && <p className="auth-message auth-message--error">{error}</p>}

                <button className="button button--auth" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <div className="auth-service-note">
                  Dùng service <code>VITE_AUTH_API_BASE_URL</code>. Nếu service chưa chạy, hệ thống dùng tài khoản seed SQL demo.
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
