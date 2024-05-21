const TaskDetails = ({ task }) => {
    return (
        <div className="task-details">
            <h4>{task.title}</h4>
            <p><strong>Description: </strong>{task.description}</p>
            <p><strong>Deadline: </strong>{task.deadline}</p>
            <p><strong>Completed: </strong>{task.isCompleted}</p>
            <p>{task.createdAt}</p>
        </div>
    )
}

export default TaskDetails