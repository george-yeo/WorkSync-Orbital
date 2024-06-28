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
                channels: action.payload,
                isRecent: action.isRecent
            }
        case 'UPDATE_CHANNEL':
            var updated = [...state.channels]
            let index = state.channels.findIndex((channel) => channel._id == action.payload._id);
            if (index == -1 && action.payload.type == "direct") {
                index = state.channels.findIndex(
                    (channel) => {
                        let found = 0
                        channel.participants.forEach(p1 => {
                            action.payload.participants.forEach(p2 => {
                                if (p1._id == p2._id) {
                                    found += 1
                                }
                            })
                        })
                        return found == 2
                    }
                );
            }
            if (index > -1) {
                updated[index] = action.payload
            } else {
                updated.push(action.payload)
            }
            return {
                ...state,
                channels: updated,
            }
        case 'SET_MESSAGES':
            return {
                ...state,
                messages: action.payload,
                newMessageUpdate: false,
            }
        case 'UPDATE_MESSAGES':
            //var updated = [...state.channels]
            //const i = state.channels.findIndex((channel) => channel._id === action.payload.channelId);
            //updated[i].lastMessage = action.payload.message
            return {
                ...state,
                //channels: updated,
                messages: [...state.messages, action.payload],
                newMessageUpdate: true,
            }
        default:
            return state
    }
}

export const ChatContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, {
        directTarget: '',
        newMessageUpdate: false,
        isRecent: true,
        channels: [],
        messages: [],
    })

    return (
        <ChatContext.Provider value={{...state, dispatch}}>
            { children }
        </ChatContext.Provider>
    )
}