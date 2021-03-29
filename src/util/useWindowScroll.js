import { useState, useEffect } from 'react';
import { useDebouncedCallback } from "use-debounce";

/**
 * Helper to have a React hook for observing scroll events
 */
export default function useWindowScroll(timeout = 50) {
    const scrollEl = document.scrollingElement;
    // Initialize state with undefined scrollX/scrollY so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [scrollState, setScrollState] = useState({
        scrollX: undefined,
        scrollY: undefined,
        scrollWidth: scrollEl?.scrollWidth,
        scrollHeight: scrollEl?.scrollHeight
    });
    
    const [ updateScrollState, cancelUpdateScrollState ] = useDebouncedCallback(() => {
        setScrollState({
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            scrollWidth: scrollEl?.scrollWidth,
            scrollHeight: scrollEl?.scrollHeight
        });
    }, timeout);

    useEffect(() => {
        // Add event listener
        window.addEventListener("scroll", updateScrollState, {passive: true});

        // Call handler right away so state gets updated with initial scroll
        updateScrollState();

        // Remove event listener on cleanup
        return () => window.removeEventListener("scroll", updateScrollState);
    }, []); // Empty array ensures that effect is only run on mount

    return scrollState;
}