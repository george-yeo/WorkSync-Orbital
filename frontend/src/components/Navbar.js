import { Link } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'
import { useEffect, useState } from 'react'

const Navbar = () => {

  const { logout } = useLogout()
  const { user } = useAuthContext()
  const [userData, setUserData] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/user/getUser/` + user._id, {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      
      const json = await response.json()
      setUserData(json[0]);
    }
    if(user){
      fetchUser()
    }
  }, [user])

  const handleClick = () => {
    logout()
  }

  return (
    <header>
      <div className="container">
        <Link to="/">
          <h1>WorkSync</h1>
        </Link>
        <nav>
        {user && (
          <div>
            <span className='username'>{userData.username}</span>
            <Link to={"/profile"}>Profile</Link>
            <button onClick={handleClick}>Log out</button>
          </div>
        )}
        {!user && (
            <div>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar