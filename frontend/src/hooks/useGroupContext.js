import { GroupContext } from "../context/GroupContext";
import { useContext } from "react";

export const useGroupContext = () => {
    const context = useContext(GroupContext)

    if (!context) {
        throw Error("useGroupContext must be used inside a GroupContextProvider")
    }

    return context
}