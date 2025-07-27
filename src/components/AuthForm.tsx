'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const formatError = (message: string) => {
    if (message.includes('auth/email-already-in-use')) return 'Email is already in use.'
    if (message.includes('auth/invalid-email')) return 'Invalid email address.'
    if (message.includes('auth/wrong-password')) return 'Incorrect password.'
    if (message.includes('auth/user-not-found')) return 'No account found with this email.'
    return 'Something went wrong. Please try again.'
  }

  const redirectToRoleDashboard = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()
        const role = userData.role

        if (role === 'admin') router.push('/admin')
        else if (role === 'tpo') router.push('/tpo')
        else if (role === 'student') router.push('/student')
        else router.push('/dashboard') // fallback
      } else {
        setError('User record not found in Firestore.')
      }
    } catch (err) {
      setError('Failed to fetch user role.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password.length < 6 && mode === 'signup') {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      let userCredential

     if (mode === 'signup') {
  userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = userCredential.user.uid

  // 🔥 Create Firestore record
  await setDoc(doc(db, 'users', uid), {
    email,
    role: 'student',
    createdAt: new Date(),
  })
} else {
  userCredential = await signInWithEmailAndPassword(auth, email, password)
}


      const uid = userCredential.user.uid
      await redirectToRoleDashboard(uid)
    } catch (err: any) {
      setError(formatError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const uid = result.user.uid

      if (uid) {
        await redirectToRoleDashboard(uid)
      } else {
        setError('Unable to retrieve user UID from Google account.')
      }
    } catch (err: any) {
      setError(formatError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('Password reset email sent. Please check your inbox.')
    } catch (err: any) {
      setError(formatError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4"
    >
      <h2 className="text-xl font-bold text-center capitalize">
        {mode === 'signup' ? 'Create an Account' : 'Login to Your Account'}
      </h2>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {message && <p className="text-green-600 text-sm text-center">{message}</p>}

      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {mode === 'login' && (
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot Password?
        </button>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
        disabled={loading}
      >
        {loading
          ? 'Please wait...'
          : mode === 'signup'
          ? 'Sign Up'
          : 'Login'}
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition"
        disabled={loading}
      >
        Continue with Google
      </button>

      <p className="text-sm text-center text-gray-600">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
