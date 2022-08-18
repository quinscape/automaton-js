import { useEffect, useRef } from 'react';

/**
 * Helper to have a useEffect that runs only on changes after it was already initialized
 */
export default function useEffectNoInitial(effect, deps) {
    
    const active = useRef(false);

    useEffect(() => {
        if (active.current) {
            return effect();
        } else {
            active.current = true;
        }
    }, deps);
}