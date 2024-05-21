import { useEffect, useState } from "react"

// components
import TaskDetails from "../components/TaskDetails"
import TaskForm from "../components/TaskForm"

const Home = () => {

    const [tasks, setTasks] = useState(null)

    useEffect(() => {
        const fetchTasks = async () => {
            const response = await fetch('/api/tasks')
            const json = await response.json()

            if (response.ok) {
                setTasks(json)
            }
        }

        fetchTasks()
    }, [])

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