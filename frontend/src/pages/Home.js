import { useEffect } from "react"
import { useTaskContext } from "../hooks/useTaskContext"
import { useSectionContext } from "../hooks/useSectionContext"
import { useAuthContext } from "../hooks/useAuthContext"

// components
import Section from "../components/Section"
import SectionForm from "../components/SectionForm"

const Home = () => {
  const taskContext = useTaskContext()
  const sectionContext = useSectionContext()
  const {user} = useAuthContext()

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/tasks', {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      
      const json = await response.json()

      if (response.ok) {
        taskContext.dispatch({type: 'SET_TASKS', payload: json})
      }
    }

    const fetchSections = async () => {
      const response = await fetch('/api/sections', {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      
      const json = await response.json()

      if (response.ok) {
        sectionContext.dispatch({type: 'SET_SECTIONS', payload: json})
      }
    }

    if (user) {
      fetchTasks()
      fetchSections()
    }
  }, [user])

  return (
    <div className="home">
      <div className="sections">
        <SectionForm />
        {sectionContext.sections && sectionContext.sections.map(section => (
          <Section section={section} tasks={taskContext.tasks} key={section._id} />
        ))}
      </div>
    </div>
  )
}
  
export default Home