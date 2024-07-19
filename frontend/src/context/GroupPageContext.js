import { createContext, useReducer } from "react"

export const GroupPageContext = createContext()

export const groupPageReducer = (state, action) => {
    let newGroup
    switch (action.type) {
        case 'SET_GROUP':
            return {
                ...state,
                group: action.payload // Replaces the group data
            }
        case 'PLANT_TREE':
            newGroup = state.group
            newGroup.isGrowingTree = true
            return {
                ...state,
                group: newGroup
            }
        default:
            return state
    }
}

export const GroupPageContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(groupPageReducer, {
        group: null,
    })

    return (
        <GroupPageContext.Provider value={{...state, dispatch}}>
            { children }
        </GroupPageContext.Provider>
    )
}