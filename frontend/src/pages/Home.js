import { useEffect } from "react"
import { useTaskContext } from "../hooks/useTaskContext"

// components
import TaskDetails from "../components/TaskDetails"
import TaskForm from "../components/TaskForm"

const Home = () => {
  const {tasks, dispatch} = useTaskContext()

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/tasks')
      const json = await response.json()

      if (response.ok) {
          dispatch({type: 'SET_TASKS', payload: json})
      }
    }

    fetchTasks()
  }, [dispatch])

  return (
    <div className="home">
      <div className="tasks">
        {tasks && tasks.map(task => (
          <TaskDetails task={task} key={task._id} />
        ))}
      </div>
      <TaskForm />
    </div>
  )
}
  
export default Home