/*
 * Copyright 2022, QuinScape GmbH. All rights reserved.
 */


import {useEffect, useState} from "react";

/**
 * This hook takes the onLoad-function of the navigation tree, executes the query (with activated count-only-mode)
 * and sets the counter-state to the value of rowCount accordingly.
 *
 * @param onLoad the onLoad-function
 * @param loadingText alternative text while waiting for the resultset.
 * @return {[string]} the value of rowCount from the executed query result.
 */
export const useCounter = (onLoad, loadingText) => {

    const [counter, setCounter] = useState(loadingText ?? "Lade...");

    useEffect(() => {
        if(typeof onLoad === "function") {
            onLoad(true).then(result => {
                setCounter(result.rowCount);
            })
        }
    }, [onLoad]);

    return [counter];
}