import { createContext, useReducer } from "react"

export const SectionContext = createContext()

export const sectionsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SECTIONS':
            return {
                sections: action.payload
            }
        case 'CREATE_SECTION':
            return {
                sections: [action.payload, ...state.sections]
            }
        case 'DELETE_SECTION':
            return {
                sections: state.sections.filter((section) => section._id !== action.payload._id)
            }
        default:
            return state
    }
}

export const SectionContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(sectionsReducer, {
        sections: null
    })

    return (
        <SectionContext.Provider value={{...state, dispatch}}>
            { children }
        </SectionContext.Provider>
    )
}