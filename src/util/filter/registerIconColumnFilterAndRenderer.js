import React from "react";
import {registerCustomFilter} from "./CustomFilter";
import {and, field, value} from "../../../filter";
import {registerCustomFilterRenderer} from "./CustomFilterRenderer";
import IconColumnFilterRenderer from "../../ui/datagrid/iconcolumn/IconColumnFilterRenderer";

export function registerIconColumnFilterAndRenderer(name, flagDataMap) {
    registerCustomFilter(name, (fieldName, filterValue) => {
        if (filterValue == null || filterValue === "") {
            return and(null);
        }

        const filterFlags = filterValue.map(flag => flag.trim());

        const filterFunctions = filterFlags.map(flag => {
            const config = flagDataMap.get(flag);
            return config.filterFunction();
        });

        return and(...filterFunctions);
    });

    registerCustomFilterRenderer(name, (fieldName, fieldType) => {
        return (
            <IconColumnFilterRenderer
                flagDataMap={flagDataMap}
                type={fieldType}
                name={fieldName}
                label=""
            />
        )
        // return (
        //     <input
        //         type="text"
        //         id={fieldName}
        //         name={fieldName}
        //     />
        // )
    });
}
