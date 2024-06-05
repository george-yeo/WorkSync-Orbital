import { useState } from "react"
import { useSignup } from "../hooks/useSignup"

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const {signup, error, isLoading} = useSignup()

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
        <label>Email address:</label>
        <input 
        type="email" 
        onChange={(e) => setEmail(e.target.value)} 
        value={email} 
        />
        <label>Password:</label>
        <input 
        type="password" 
        onChange={(e) => setPassword(e.target.value)} 
        value={password} 
        />
        <ul className="password-reqs">
          <li>7 characters</li>
          <li>Upper and lowercase</li>
          <li>Numbers and special characters</li>
        </ul>

        <label>Confirm password:</label>
        <input 
        type="password" 
        onChange={(e) => setConfirmPassword(e.target.value)} 
        value={confirmPassword} 
        />
        
        <button disabled={isLoading}>Sign up</button>
        {error && <div className="error">{error}</div>}
    </form>
  )
}

export default Signup