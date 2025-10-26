import { Mail, User2Icon } from 'lucide-react'
import React from 'react'
import api from '../configs/api'
import { useDispatch } from 'react-redux'
import { login } from '../app/features/authSlice'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
  const dispatch = useDispatch()
  const [otpSent, setOtpSent] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    otp: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (otpSent) {
        const { data } = await api.post(`/api/users/verify-otp`, { email: formData.email, otp: formData.otp })
        dispatch(login(data))
        localStorage.setItem('token', data.token)
        toast.success(data.message)
      } else {
        const { data } = await api.post(`/api/users/send-otp`, { email: formData.email, name: formData.name })
        setOtpSent(true)
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { data } = await api.post('/api/users/google-login', { credential: credentialResponse.credential })
      dispatch(login(data))
      localStorage.setItem('token', data.token)
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <div className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-10">
        <h1 className="text-gray-900 text-3xl font-medium">{otpSent ? "Verify OTP" : "Login"}</h1>
        <p className="text-gray-500 text-sm mt-2">Please enter your details to continue</p>
        <form onSubmit={handleSubmit}>
          {!otpSent && (
            <div className="flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
              <User2Icon size={16} color='#6B7280'/>
              <input
                type="text"
                name="name"
                placeholder="Name (optional)"
                className="border-none outline-none ring-0"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <Mail size={13} color="#6B7280" />
            <input
              type="email"
              name="email"
              placeholder="Email id"
              className="border-none outline-none ring-0"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={otpSent}
            />
          </div>

          {otpSent && (
            <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
              <input
                type="text"
                name="otp"
                placeholder="OTP"
                className="border-none outline-none ring-0"
                value={formData.otp}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="mt-4 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity">
            {otpSent ? "Verify OTP" : "Send OTP"}
          </button>
        </form>

        <div className='mt-4'>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              toast.error('Google login failed')
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Login
