import { createContext, useReducer } from "react"

export const ChatContext = createContext()

export const chatReducer = (state, action) => {
    switch (action.type) {
        case 'SET_DIRECT':
            return {
                ...state,
                directTarget: action.payload
            }
        case 'SET_CHANNELS':
            return {
                ...state,
                channels: action.payload
            }
        case 'SET_MESSAGES':
            return {
                ...state,
                messages: action.payload
            }
        case 'UPDATE_MESSAGES':

            return {
                ...state,
                messages: [action.payload, ...state.messages]
            }
        default:
            return state
    }
}

export const ChatContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, {
        directTarget: '',
        channels: [],
        messages: [],
    })

    return (
        <ChatContext.Provider value={{...state, dispatch}}>
            { children }
        </ChatContext.Provider>
    )
}