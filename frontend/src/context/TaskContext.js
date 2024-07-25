import { createContext, useReducer } from "react"

export const TaskContext = createContext()

export const tasksReducer = (state, action) => {
    switch (action.type) {
        case 'RESET':
            return {
                tasks: null
            }
        case 'SET_TASKS':
            return {
                tasks: action.payload
            }
        case 'CREATE_TASK':
            return {
                tasks: [action.payload, ...state.tasks]
            }
        case 'DELETE_TASK':
            return {
                tasks: state.tasks.filter((task) => task._id !== action.payload._id)
            }
        case 'UPDATE_TASK':
            var updated = [...state.tasks]
            const i = state.tasks.findIndex((task) => task._id === action.payload._id);
            updated[i] = action.payload
            return {
                tasks: updated
            }
        default:
            return state
    }
}

export const TaskContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(tasksReducer, {
        tasks: null
    })

    return (
        <TaskContext.Provider value={{...state, dispatch}}>
            { children }
        </TaskContext.Provider>
    )
}