import { createContext, useReducer } from "react"

export const GroupPageContext = createContext()

export const groupPageReducer = (state, action) => {
    let newGroup
    switch (action.type) {
        case 'RESET':
            return {
                group: null
            }
        case 'SET_GROUP':
            return {
                ...state,
                group: action.payload // Replaces the group data
            }
        case 'PLANT_TREE':
            newGroup = state.group
            newGroup.treeGrowthProgress = 0
            newGroup.isGrowingTree = true
            return {
                ...state,
                group: newGroup
            }
        case 'ADD_COMMENT':
            newGroup = state.group
            newGroup.selectedComment = action.payload
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