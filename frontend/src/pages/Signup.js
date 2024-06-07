import { useState } from "react"
import { useSignup } from "../hooks/useSignup"

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const {signup, error, isLoading} = useSignup()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowComfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    await signup(email, password, confirmPassword, username)
  }

  return (
    <form className="signup" onSubmit={handleSubmit}>
        <h3>Sign Up</h3>

        <label>Username:</label>
        <input 
        type="username" 
        onChange={(e) => setUsername(e.target.value)} 
        value={username}
        /> 
        <ul className="username-reqs">
          <li>4-20 characters</li>
          <li>Only letters and numbers (a-z A-Z 0-9)</li>
        </ul>
        <label>Email address:</label>
        <input 
        type="email" 
        onChange={(e) => setEmail(e.target.value)} 
        value={email} 
        />
        <label>Password:</label>
        <div className="password-field">
          <input 
            type={showPassword ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-btn"
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        <ul className="password-reqs">
          <li>7 characters</li>
          <li>Upper and lowercase</li>
          <li>Numbers and special characters</li>
        </ul>

        <label>Confirm password:</label>
        <div className="password-field">
          <input 
            type={showConfirmPassword ? "text" : "password"}
            onChange={(e) => setConfirmPassword(e.target.value)} 
            value={confirmPassword} 
          />
          <button
            type="button"
            onClick={() => setShowComfirmPassword(!showConfirmPassword)}
            className="toggle-btn"
          >
          <span className="material-symbols-outlined">
            {showConfirmPassword ? 'visibility_off' : 'visibility'}
          </span>
          </button>
        </div>
        <button disabled={isLoading}>Sign up</button>
        {error && <div className="error">{error}</div>}
    </form>
  )
}

export default Signup