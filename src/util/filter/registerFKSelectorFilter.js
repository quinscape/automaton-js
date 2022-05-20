import React from "react";

import {registerCustomFilter} from "./CustomFilter";
import {registerCustomFilterRenderer} from "./CustomFilterRenderer";
import {field, value} from "../../../filter";
import {Field, useFormConfig} from "../../../../domainql-form";
import {FKSelector} from "../../index";


/**
 * Register a filter renderer for an FKSelector
 *
 * @param {String} name filter renderer alias
 * @param {Object} query the query used for the FKSelector
 * @param {String} rootType the table that the FKSelector works on
 * @param {String} sourceName path of the FKSelector inside the table
 * @param {String} modalTitle title of the FKSelectorModal
 * @param {String} valueFieldName the value of the FKSelector table used by the filter
 */
export function registerFKSelectorFilterAndRenderer(name, query, rootType, sourceName, modalTitle, valueFieldName) {
    registerCustomFilter(name, (fieldName, row) => {
        const fieldValue = row?.[valueFieldName];
        if (fieldValue) {
            return field(fieldName).eq(value(fieldValue, "String"));
        }
        return null;
    });

    registerCustomFilterRenderer(name, (fieldName, fieldType, label) => {
        const formConfig = useFormConfig();
        return(<FKSelector
            name={fieldName}
            type={fieldType}
            label={label}
            query={query}
            rootType={rootType}
            sourceName={sourceName}
            labelClass="sr-only"
            display={(formConfig, ctx) => {
                const row = Field.getValue(formConfig, ctx);
                return row?.[valueFieldName];
            }}
            modalTitle={modalTitle}
            searchFilter={valueFieldName}
            onChange={({fieldContext, row}) => {
                formConfig.handleChange(fieldContext, row);
            }}
        />);
    });
}