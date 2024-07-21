import { createContext, useReducer } from "react"

export const GroupContext = createContext()

export const groupReducer = (state, action) => {
    switch (action.type) {
        case 'SET_GROUPS':
            return {
                ...state,
                groups: action.payload // Replaces the entire groups list
            }
        case 'CREATE_GROUP':
            return {
                ...state,
                groups: [action.payload, ...state.groups] // Adds the new group to the beginning
            }
        case 'UPDATE_GROUP':
            return {
                ...state,
                groups: state.groups.map(group =>
                    group._id === action.payload._id ? action.payload : group // Updates the specific group
                )
            }
        case 'DELETE_GROUP':
            return {
                ...state,
                groups: state.groups.filter(group => group._id !== action.payload) // Removes the specific group by ID
            }
        case 'SET_SEARCH_RESULTS':
            return {
                ...state,
                searchResults: action.payload
            }
        default:
            return state
    }
}

export const GroupContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(groupReducer, {
        groups: null,
        searchResults: null
    })

    return (
        <GroupContext.Provider value={{...state, dispatch}}>
            { children }
        </GroupContext.Provider>
    )
}