import { useContext } from "react"
import { AutomatonEnv } from "./Process";

/**
 * Convenience hook to get the current automaton env from the context.
 */
export default function useAutomatonEnv() {
    return useContext(AutomatonEnv)
}

