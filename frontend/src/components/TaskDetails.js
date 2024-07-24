import { useState } from "react";
import { useTaskContext } from "../hooks/useTaskContext"
import { useAuthContext } from "../hooks/useAuthContext";

// components
import TaskForm from './TaskForm';

// date-fns
import { formatDistanceToNow, differenceInSeconds } from "date-fns"

const TaskDetails = ({ task }) => {
    const { dispatch } = useTaskContext();
    const { user } = useAuthContext()
    const [isOpen, setIsOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const openPopup = () => {
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    const handleDeleteClick = async () => {
        if (!user) {
            return
        }

        const response = await fetch('/api/tasks/' + task._id, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await response.json()

        if (response.ok) {
            dispatch({type: 'DELETE_TASK', payload: json})
        }
    }

    const handleCompleteClick = async () => {
        if (!user) {
            return
        }
        
        task.isCompleted = !task.isCompleted

        const response = await fetch('/api/tasks/' + task._id, {
            method: 'PATCH',
            body: JSON.stringify(task),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        const json = await response.json()

        if (response.ok) {
            dispatch({type: 'UPDATE_TASK', payload: json})

            const sectionResponse = await fetch('api/sections/' + task.sectionId, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })

            const section = await sectionResponse.json()

            if (section[0].isGroup){
                if(task.isCompleted) {
                    const addResponse = await fetch('api/group/addGrowth/' + section[0].group_id, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    })
                    const addJson = await addResponse.json()
                } else {
                    const subResponse = await fetch('api/group/subGrowth/' + section[0].group_id, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    })
                    const subJson = await subResponse.json()
                }
            }
        }
    }

    const handleExpandClick = () => {
        setIsOpen((prev) => !prev)
    }

    const isOverdue = task.deadline ? differenceInSeconds(new Date(), new Date(task.deadline)) >= 0 : false

    const desc = task.description != "" ? task.description : "None provided"

    const contents = (
        <div>
            <p><strong>Description: </strong>{desc}</p>
            {task.deadline && <p className={isOverdue ? "overdue" : ''}><strong>Deadline: </strong>{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</p>}
            <p>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
        </div>
    )

    return (
        <li className={"task-details" + (task.isCompleted ? " checked" : "")}>
            <h4 
            className={(task.isCompleted ? " checked" : "")}
            onClick={handleExpandClick}>
                {task.title}
            </h4>
            <span className="material-symbols-outlined checkbox" onClick={handleCompleteClick}>
                circle
                <span className={"material-symbols-outlined tick" + (!task.isCompleted ? " hide" : "")}>check</span>
            </span>
            <div>{isOpen && <div className="task-details-contents" onClick={openPopup}>{contents}</div>}</div>
            <span className="material-symbols-outlined delete hide" onClick={handleDeleteClick}>delete</span>
            {isOpen && <span className="material-symbols-outlined edit hide" onClick={openPopup}>edit</span>}
            {showPopup && <TaskForm editingTask={task} closePopup={closePopup} />}
        </li>
    )
}

/**/

export default TaskDetails