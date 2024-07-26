import { GroupPageContext } from "../context/GroupPageContext";
import { useContext } from "react";

export const useGroupPageContext = () => {
    const context = useContext(GroupPageContext)

    if (!context) {
        throw Error("useGroupPageContext must be used inside a GroupPageContextProvider")
    }

    return context
}