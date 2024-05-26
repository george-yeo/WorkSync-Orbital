import { useTaskContext } from "../hooks/useTaskContext"
import { useSectionContext } from "../hooks/useSectionContext"
import { useAuthContext } from "../hooks/useAuthContext";

import TaskDetails from "../components/TaskDetails"
import TaskForm from "../components/TaskForm"

const Section = ({ section, tasks }) => {
    //const { taskDispatch } = useTaskContext();
    //const { sectionDispatch } = useSectionContext();
    const { user } = useAuthContext()

    return (
        <div className="task-section">
            <h1>{section.title}</h1>
            <ul>
                {tasks && tasks.filter((task) => task.sectionId === section._id).map(task => (
                    <TaskDetails task={task} key={task._id} />
                ))}
            </ul>
            <TaskForm section={section} />
        </div>
    )
}

export default Section