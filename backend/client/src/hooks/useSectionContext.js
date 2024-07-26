import { SectionContext } from "../context/SectionContext";
import { useContext } from "react";

export const useSectionContext = () => {
    const context = useContext(SectionContext)

    if (!context) {
        throw Error("useSectionContext must be used inside a SectionContextProvider")
    }

    return context
}