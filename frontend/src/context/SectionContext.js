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
        case 'UPDATE_SECTION':
            // Ensure payload is an array
            const updatedSections = (Array.isArray(action.payload) ? action.payload : [action.payload]).reduce((acc, section) => {
                const index = acc.findIndex(s => s._id === section._id);
                if (index >= 0) {
                    acc[index] = section; // Update existing section
                } else {
                    acc.push(section); // Add new section
                }
                return acc;
            }, [...state.sections]);
            return {
                sections: updatedSections
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
        <SectionContext.Provider value={{ ...state, dispatch }}>
            {children}
        </SectionContext.Provider>
    )
}