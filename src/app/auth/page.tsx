'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import './auth.css'

export default function AuthPage() {
  const { user, loading, isRecovery, signIn, signUp, updatePassword, clearRecovery } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user && !isRecovery) router.replace('/')
  }, [user, loading, router, isRecovery])

  if (loading) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isRecovery) {
        await updatePassword(password)
        router.replace('/')
      } else if (mode === 'login') {
        await signIn(email, password)
        router.replace('/')
      } else {
        await signUp(email, password, inviteCode)
        router.replace('/')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const actualMode = isRecovery ? 'reset' : mode
  const subtitle = actualMode === 'login' ? '登录你的账户' : actualMode === 'register' ? '创建新账户' : '设置新密码'

  return (
    <div className="auth-page">
      <div className="auth-card float-card glow-coral anim">
        <h1 className="auth-title">Level <span>Up</span></h1>
        <p className="auth-subtitle">{subtitle}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {actualMode !== 'reset' && (
            <label>
              邮箱
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            {actualMode === 'reset' ? '新密码' : '密码'}
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {actualMode === 'register' && (
            <label>
              邀请码
              <input
                className="field-input"
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                required
              />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn-warm auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? '请稍候...' : actualMode === 'login' ? '登录' : actualMode === 'register' ? '注册' : '确认新密码'}
          </button>
        </form>

        {actualMode !== 'reset' && (
          <div className="auth-toggle">
            {mode === 'login' ? '没有账户？' : '已有账户？'}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? '注册' : '登录'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
