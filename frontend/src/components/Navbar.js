import { Link, useNavigate } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'
import { useEffect, useState } from 'react'

const Navbar = () => {

  const { logout } = useLogout()
  const { user } = useAuthContext()
  const [userData, setUserData] = useState('');
  const navigate = useNavigate()

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

  const handleProfileNavigate = () => {
    navigate("/profile")
  }

  return (
    <header>
      <div className="container">
        <Link to="/">
          <h1>WorkSync</h1>
        </Link>
        {user && (
          <div className='links'>
            <Link to="/">
              <h3>Home</h3>
            </Link>
            <Link to="/group">
              <h3>Groups</h3>
            </Link>
            <Link to="/profile">
              <h3>Profile</h3>
            </Link>
          </div>
        )}
        <nav>
        {user && (
          <div className='user-details' onClick={handleProfileNavigate}>
            <img
              src= {`data:image/jpeg;base64, ${userData.profilePic}`}  
              alt="Profile Picture"
              className="profile-pic"
            />
            <span className='username'>{userData.username}</span>
            {/* <Link to={"/profile"}>Profile</Link> */}
          </div>
        )}
        {user && <button className='logout' onClick={handleClick}>Log out</button>}
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