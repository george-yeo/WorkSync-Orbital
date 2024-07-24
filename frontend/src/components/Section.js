//import { useTaskContext } from "../hooks/useTaskContext"
//import { useSectionContext } from "../hooks/useSectionContext"
//import { useAuthContext } from "../hooks/useAuthContext";

import TaskDetails from "../components/TaskDetails"
import TaskFormBtn from "../components/TaskFormBtn"

const Section = ({ section, tasks, group_id, canManage }) => {
    //const { taskDispatch } = useTaskContext();
    //const { sectionDispatch } = useSectionContext();
    //const { user } = useAuthContext()

    return (
        <div className="task-section">
            <h1>{group_id ? "Tasks for Group" : section.title}</h1>
            {group_id && <sub>Complete your tasks to grow the SyncTree!</sub>}
            <ul>
                {tasks && tasks.filter((task) => task.sectionId === section._id).map(task => (
                    <TaskDetails task={task} key={task._id} />
                ))}
                {tasks && tasks.filter((task) => task.sectionId === section._id).length == 0 && <div>
                    It's empty here...
                </div>}
            </ul>
            <div className="add-task">
                <TaskFormBtn section={section} />
                {group_id && canManage && <TaskFormBtn group_id={group_id} section={section} />}
            </div>
        </div>
    )
}

export default Section