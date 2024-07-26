//import { useTaskContext } from "../hooks/useTaskContext"
//import { useSectionContext } from "../hooks/useSectionContext"
//import { useAuthContext } from "../hooks/useAuthContext";

import { differenceInSeconds } from "date-fns"
import TaskDetails from "../components/TaskDetails"
import TaskFormBtn from "../components/TaskFormBtn"

const Section = ({ section, tasks, group_id, canManage }) => {
    //const { taskDispatch } = useTaskContext();
    //const { sectionDispatch } = useSectionContext();
    //const { user } = useAuthContext()

    let filteredTasks
    if (tasks) {
        // load tasks only relevant to section & remove tasks completed after 5 mins
        filteredTasks = tasks.filter((task) => task.sectionId === section._id && (task.isCompleted === false || differenceInSeconds(new Date(), task.updatedAt) < 60*5))
    }

    return (
        <div className="task-section">
            <h1>{group_id ? "Tasks for Group" : section.title}</h1>
            {group_id && <sub>Complete your tasks to grow the SyncTree!</sub>}
            <ul>
                {filteredTasks && filteredTasks.map(task => (
                    <TaskDetails task={task} key={task._id} />
                ))}
                {(!filteredTasks || filteredTasks.length == 0) && <div>
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