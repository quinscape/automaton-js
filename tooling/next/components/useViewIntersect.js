import { useRef, useCallback, useContext, useEffect } from 'react';
import ReadingPosition from "./ReadingPosition";

/**
 * Helper to have a React hook for observing viewport-element intersection
 */
export default function useViewIntersect()
{
    const ref = useRef();
    const intersectionContext = useContext(ReadingPosition);
    useEffect(
        () => {
            if (ref.current != null && intersectionContext != null)
            {
                intersectionContext.intersectionObserver.observe(ref.current);
            }
        },
        [intersectionContext, ref.current]
    );
    const setRef = useCallback(
        node => {
            if (ref.current != null && intersectionContext != null)
            {
                intersectionContext.intersectionObserver.unobserve(ref.current);
            }
            ref.current = node;
        },
        []
    )
    return setRef;
}