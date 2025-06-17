import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js'
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
import ReactRouterDOM from 'https://cdn.jsdelivr.net/npm/react-router-dom@6.23.0/umd/react-router-dom.production.min.js'
import { AuthProvider, useAuth } from './AuthContext.js'

const { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } = ReactRouterDOM
const e = React.createElement

function LoginForm() {
  const { login, isAuthenticated, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = React.useState({ username: '', password: '' })

  const handleChange = (ev) => setForm({ ...form, [ev.target.name]: ev.target.value })

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const { success } = await login(form.username, form.password)
    if (success) navigate('/')
  }

  React.useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  if (isAuthenticated) return e(Navigate, { to: '/' })

  return e(
    'form',
    { onSubmit: handleSubmit },
    e('h2', null, 'Login'),
    e('input', { name: 'username', placeholder: 'Username or Email', value: form.username, onChange: handleChange }),
    e('input', { type: 'password', name: 'password', placeholder: 'Password', value: form.password, onChange: handleChange }),
    e('button', { type: 'submit' }, 'Login'),
    e('p', null, e(Link, { to: '/register' }, 'Need an account? Register')),
    error && e('div', { style: { color: 'red' } }, error)
  )
}

function RegisterForm() {
  const { register, isAuthenticated, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = React.useState({ username: '', email: '', password: '' })

  const handleChange = (ev) => setForm({ ...form, [ev.target.name]: ev.target.value })

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const { success } = await register(form.username, form.email, form.password)
    if (success) navigate('/login')
  }

  React.useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  if (isAuthenticated) return e(Navigate, { to: '/' })

  return e(
    'form',
    { onSubmit: handleSubmit },
    e('h2', null, 'Register'),
    e('input', { name: 'username', placeholder: 'Username', value: form.username, onChange: handleChange }),
    e('input', { name: 'email', placeholder: 'Email', value: form.email, onChange: handleChange }),
    e('input', { type: 'password', name: 'password', placeholder: 'Password', value: form.password, onChange: handleChange }),
    e('button', { type: 'submit' }, 'Create account'),
    e('p', null, e(Link, { to: '/login' }, 'Back to login')),
    error && e('div', { style: { color: 'red' } }, error)
  )
}

function ChangePasswordForm() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = React.useState({ current: '', new: '' })
  const [message, setMessage] = React.useState(null)

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const { success, error } = await changePassword(form.current, form.new)
    if (success) {
      setMessage('Password changed successfully')
      setTimeout(() => navigate('/'), 1000)
    } else {
      setMessage(error)
    }
  }

  return e(
    'form',
    { onSubmit: handleSubmit },
    e('h2', null, 'Change Password'),
    e('input', { type: 'password', placeholder: 'Current password', value: form.current, onChange: (ev) => setForm({ ...form, current: ev.target.value }) }),
    e('input', { type: 'password', placeholder: 'New password', value: form.new, onChange: (ev) => setForm({ ...form, new: ev.target.value }) }),
    e('button', { type: 'submit' }, 'Change'),
    message && e('div', null, message)
  )
}

function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  if (isLoading) return e('div', null, 'Loading...')
  if (!isAuthenticated) return e(Navigate, { to: '/login' })
  return e(
    'div',
    null,
    e('h2', null, `Welcome ${user.username}`),
    e('p', null, e(Link, { to: '/change-password' }, 'Change password')),
    e('button', { onClick: logout }, 'Logout')
  )
}

function App() {
  return e(
    BrowserRouter,
    null,
    e(
      Routes,
      null,
      e(Route, { path: '/login', element: e(LoginForm) }),
      e(Route, { path: '/register', element: e(RegisterForm) }),
      e(Route, { path: '/change-password', element: e(ChangePasswordForm) }),
      e(Route, { path: '*', element: e(Home) })
    )
  )
}

const rootEl = document.getElementById('root')
ReactDOM.createRoot(rootEl).render(
  e(AuthProvider, null, e(App))
)
