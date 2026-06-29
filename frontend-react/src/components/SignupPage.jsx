import { useState } from 'react'
import { authClient } from '../api/authClient'

function InputShell({ icon, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="form-field form-field--compact">
      <span>{icon}</span>
      <input
        autoComplete={type === 'password' ? 'new-password' : name}
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
    return 'Không kết nối được dịch vụ đăng ký SQL. Kiểm tra VITE_AUTH_API_BASE_URL hoặc server auth.'
  }

  return error?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
}

function SignupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    code: '',
    password: '',
    acceptedTerms: false,
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateForm(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function submitSignup(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.acceptedTerms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng trước khi tạo tài khoản.')
      return
    }

    setIsSubmitting(true)

    try {
      await authClient.signup({
        HoTen: form.fullName.trim(),
        Email: form.email.trim(),
        MaDinhDanh: form.code.trim(),
        MatKhau: form.password,
      })

      setNotice('Tạo tài khoản thành công. Chuyển sang trang đăng nhập...')
      window.setTimeout(() => {
        window.location.hash = '#login'
      }, 700)
    } catch (signupError) {
      setError(getFriendlyError(signupError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-page--signup">
      <div className="auth-container auth-container--compact">
        <div className="auth-page__nav">
          <a className="button button--glass" href="#top">
            ← Về landing page
          </a>
          <a className="auth-page__link" href="#login">
            Đã có tài khoản?
          </a>
        </div>

        <section className="auth-card">
          <div className="auth-card__grid auth-card__grid--signup">
            <div className="auth-visual auth-visual--signup">
              <div className="auth-visual__pattern" />
              <div className="auth-visual__copy auth-visual__copy--center">
                <p className="eyebrow">Get Started</p>
                <h1>Bắt đầu</h1>
                <p>Đã có tài khoản? Đăng nhập để tiếp tục vào khu vực điều hành kỳ thi.</p>
                <a className="button button--outline" href="#login">
                  Log in
                </a>
              </div>
            </div>

            <div className="auth-form-panel">
              <form className="auth-form auth-form--signup" onSubmit={submitSignup}>
                <div className="auth-form__heading">
                  <div>
                    <p className="eyebrow">Sign up</p>
                    <h2>Tạo tài khoản</h2>
                  </div>
                  <span>Need help?</span>
                </div>

                <div className="auth-fields auth-fields--compact">
                  <InputShell
                    icon="👤"
                    name="fullName"
                    onChange={updateForm}
                    placeholder="Họ và tên"
                    value={form.fullName}
                  />
                  <InputShell
                    icon="✉️"
                    name="email"
                    onChange={updateForm}
                    placeholder="Email"
                    type="email"
                    value={form.email}
                  />
                  <InputShell
                    icon="🏫"
                    name="code"
                    onChange={updateForm}
                    placeholder="Mã sinh viên / mã cán bộ"
                    value={form.code}
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

                <label className="terms-row">
                  <input
                    checked={form.acceptedTerms}
                    name="acceptedTerms"
                    onChange={updateForm}
                    type="checkbox"
                  />
                  <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của hệ thống.</span>
                </label>

                {error && <p className="auth-message auth-message--error">{error}</p>}
                {notice && <p className="auth-message auth-message--success">{notice}</p>}

                <button className="button button--signup" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Sign up'}
                </button>

                <a className="auth-page__link auth-page__link--center" href="#login">
                  Đã có tài khoản?
                </a>

                <p className="auth-legal">SQL auth service • Không gọi Ruby/C#</p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SignupPage
