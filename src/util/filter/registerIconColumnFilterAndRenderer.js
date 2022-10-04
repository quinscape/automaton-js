import React from "react";
import {registerCustomFilter} from "./CustomFilter";
import {and, field, value} from "../../../filter";
import {registerCustomFilterRenderer} from "./CustomFilterRenderer";
import IconColumnFilterRenderer from "../../ui/datagrid/iconcolumn/IconColumnFilterRenderer";
import {extractValueNodes} from "../../ui/datagrid/GridStateForm";
import i18n from "../../i18n";
import {DateTime} from "luxon";

export function registerIconColumnFilterAndRenderer(name, flagDataMap) {
    registerCustomFilter(name,
        (fieldName, filterValue) => {
            if (filterValue == null || filterValue === "") {
                return and(null);
            }

            const filterFlags = filterValue.map(flag => flag.trim());

            const filterFunctions = filterFlags.map(flag => {
                const config = flagDataMap.get(flag);
                return config.filterFunction();
            });

            return and(...filterFunctions);
        },
        (column, columnCondition) => {
            return [
                {
                    type: "StringSet",
                    label: i18n("Filter:" + column.name),
                    value: []
                }
            ];
        }
    );

    registerCustomFilterRenderer(name, (fieldName, fieldType) => {
        return (
            <IconColumnFilterRenderer
                flagDataMap={flagDataMap}
                type={fieldType}
                name={fieldName}
                label=""
            />
        )
    });
}
