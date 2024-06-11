import { useEffect, useState } from "react"
import { useTaskContext } from "../hooks/useTaskContext"
import { useSectionContext } from "../hooks/useSectionContext"
import { useAuthContext } from "../hooks/useAuthContext"
import { useSocketContext } from "../hooks/useSocketContext"

// components
import Section from "../components/Section"
import SectionForm from "../components/SectionForm"

const Home = () => {
  const taskContext = useTaskContext()
  const sectionContext = useSectionContext()

  const { user } = useAuthContext()
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch(`/api/tasks?sortBy=${sortBy}&sortOrder=${sortOrder}`, {
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
  }, [user, sortBy, sortOrder])

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="home">
      <SectionForm />
      <div className="sorting-controls">
        <label>Sort by: </label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="createdAt">Creation Date</option>
          <option value="title">Title</option>
          <option value="description">Description</option>
          <option value="deadline">Deadline</option>
        </select>
        <span className="material-symbols-outlined arrow" onClick={() => handleSortChange(sortBy)}>
          {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
        </span>
      </div>
        {sectionContext.sections && sectionContext.sections.map(section => (
          <Section section={section} tasks={taskContext.tasks} key={section._id} />
        ))}
    </div>
  )
}
  
export default Home