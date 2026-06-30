import { useEffect, useState } from 'react'
import { authClient, generateNextAccountCodeFromBackend } from '../api/authClient'

const signupRoles = [
  { value: '4', label: 'Sinh vien' },
  { value: '2', label: 'Can bo dao tao' },
  { value: '3', label: 'Can bo khao thi' },
]

function InputShell({
  icon,
  name,
  onChange,
  onTogglePassword,
  placeholder,
  readOnly = false,
  showPassword = false,
  type = 'text',
  value,
}) {
  const isPassword = type === 'password'

  return (
    <label className="form-field form-field--compact">
      <span>{icon}</span>
      <input
        autoComplete={isPassword ? 'new-password' : name}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
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

function SelectShell({ icon, name, onChange, value }) {
  return (
    <label className="form-field form-field--compact">
      <span>{icon}</span>
      <select name={name} onChange={onChange} value={value}>
        {signupRoles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function getFriendlyError(error) {
  return error?.message || 'Dang ky that bai. Vui long thu lai.'
}

function SignupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    roleId: '4',
    code: '',
    password: '',
    acceptedTerms: false,
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const isStudentRole = form.roleId === '4'

  useEffect(() => {
    let isMounted = true

    async function refreshGeneratedCode() {
      if (!isStudentRole) {
        setForm((current) => ({ ...current, code: '' }))
        setIsGeneratingCode(false)
        return
      }

      setIsGeneratingCode(true)
      const nextCode = await generateNextAccountCodeFromBackend(4)
      if (isMounted) {
        setForm((current) => ({ ...current, code: nextCode }))
        setIsGeneratingCode(false)
      }
    }

    refreshGeneratedCode()
    return () => {
      isMounted = false
    }
  }, [isStudentRole])

  function updateForm(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'roleId' && value !== '4' ? { code: '' } : {}),
    }))
  }

  async function submitSignup(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.acceptedTerms) {
      setError('Ban can dong y voi dieu khoan su dung truoc khi tao tai khoan.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await authClient.signup({
        HoTen: form.fullName.trim(),
        Email: form.email.trim(),
        MaDinhDanh: isStudentRole ? form.code.trim() : undefined,
        MaSinhVien: isStudentRole ? form.code.trim() : undefined,
        VaiTroID: Number(form.roleId),
        MatKhau: form.password,
      })

      const sourceNote = result?.authSource === 'local-sql-demo-signup'
        ? ` Tao bang demo local voi ma ${result.generatedCode || form.code}.`
        : ''

      setNotice(`Tao tai khoan thanh cong.${sourceNote} Chuyen sang trang dang nhap...`)
      window.setTimeout(() => {
        window.location.hash = '#login'
      }, 900)
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
            Back to landing page
          </a>
          <a className="auth-page__link" href="#login">
            Da co tai khoan?
          </a>
        </div>

        <section className="auth-card">
          <div className="auth-card__grid auth-card__grid--signup">
            <div className="auth-visual auth-visual--signup">
              <div className="auth-visual__pattern" />
              <div className="auth-visual__copy auth-visual__copy--center">
                <p className="eyebrow">Get Started</p>
                <h1>Bat dau</h1>
                <p>Da co tai khoan? Dang nhap de tiep tuc vao khu vuc dieu hanh ky thi.</p>
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
                    <h2>Tao tai khoan</h2>
                  </div>
                  <span>Need help?</span>
                </div>

                <div className="auth-fields auth-fields--compact">
                  <InputShell
                    icon="@"
                    name="fullName"
                    onChange={updateForm}
                    placeholder="Ho va ten"
                    value={form.fullName}
                  />
                  <InputShell
                    icon="mail"
                    name="email"
                    onChange={updateForm}
                    placeholder="Email"
                    type="email"
                    value={form.email}
                  />
                  <SelectShell
                    icon="role"
                    name="roleId"
                    onChange={updateForm}
                    value={form.roleId}
                  />
                  {isStudentRole && (
                    <InputShell
                      icon="id"
                      name="code"
                      onChange={() => {}}
                      placeholder="Ma sinh vien"
                      readOnly
                      value={isGeneratingCode ? 'Dang tao ma...' : form.code}
                    />
                  )}
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

                <label className="terms-row">
                  <input
                    checked={form.acceptedTerms}
                    name="acceptedTerms"
                    onChange={updateForm}
                    type="checkbox"
                  />
                  <span>Toi dong y voi dieu khoan su dung va chinh sach bao mat cua he thong.</span>
                </label>

                {error && <p className="auth-message auth-message--error">{error}</p>}
                {notice && <p className="auth-message auth-message--success">{notice}</p>}

                <button className="button button--signup" disabled={isSubmitting || isGeneratingCode} type="submit">
                  {isSubmitting ? 'Dang tao tai khoan...' : 'Sign up'}
                </button>

                <a className="auth-page__link auth-page__link--center" href="#login">
                  Da co tai khoan?
                </a>

                <p className="auth-legal">SQL auth service - fallback demo local neu service chua chay</p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SignupPage
