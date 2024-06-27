import { createContext, useReducer } from "react"

export const GroupContext = createContext()

export const groupReducer = (state, action) => {
    switch (action.type) {
        case 'SET_GROUPS':
            return {
                groups: action.payload
            }
        case 'CREATE_GROUP':
            return {
                groups: [action.payload, ...state.groups]
            }
        case 'DELETE_TASK':
            return {
                tasks: state.tasks.filter((task) => task._id !== action.payload._id)
            }
        default:
            return state
    }
}

export const GroupContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(groupReducer, {
        groups: null
    })

    return (
        <GroupContext.Provider value={{...state, dispatch}}>
            { children }
        </GroupContext.Provider>
    )
}