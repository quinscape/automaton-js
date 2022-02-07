import { useState, useEffect } from 'react';

/**
 * Helper to have a React hook for observing element sizes
 */
export default function useResizeObserver(ref) {
    const [elementSize, setElementSize] = useState({
        width: undefined,
        height: undefined,
    });

    function handleResize() {
        const refEl = ref.current;
        if (refEl != null) {
            setElementSize({
                width: refEl.offsetWidth,
                height: refEl.offsetHeight,
            });
        }
    }
    
    const observer = new ResizeObserver(handleResize);

    useEffect(() => {
        const refEl = ref.current;
        if (refEl != null) {
            observer.observe(ref.current);
            handleResize();
        }
        return () => observer.disconnect();
    }, [ref.current]);

    return elementSize;
}