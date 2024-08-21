import React from "react";
import {registerCustomFilter} from "./CustomFilter";
import { registerCustomFilterRenderer } from "./CustomFilterRenderer";
import {field, value} from "../../../filter";
import { parseSearch, stringifySearch, validateSearch } from "../converter/SearchStringConverter";
import { extractValueNodes } from "../../ui/datagrid/GridStateForm";
import i18n from "../../i18n";
import { Field } from "domainql-form";

/**
 * Creates and registers the filter for pattern input.
 * 
 * Filter rules are as follows:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "/"
 * - "not" is written as "!" (if allowed)
 * - no brackets
 * - "and" binds stronger than "or"
 * - if there is no expression, just match as contains
 */
export function registerLikePatternFilter()
{
    const NAME = "likePattern";

    registerCustomFilter(NAME, (fieldName, val) => {
        if (val == null || val === "") {
            return null
        }
        const stringValue = val.toString();
        const regExpString = parseSearch(stringValue.toLowerCase());
        return field(fieldName).toString().lower().likeRegex(value(regExpString, "String"));
    }, (column, columnCondition) => {
        const valueNodes = extractValueNodes(columnCondition);
        const regExpString = valueNodes?.[0]?.value;
        return [
            {
                type: "String",
                label: i18n("Filter:" + column.name),
                value: stringifySearch(regExpString)
            }
        ];
    }, (fieldName) => field(fieldName).toString().lower().likeRegex(value(null, "String")));

    registerCustomFilterRenderer(NAME, (fieldName, fieldType, label) => {
        if (!fieldType) {
            const fieldSchemaType = config.inputSchema.resolveType(rootType, sourceName);
            fieldType = getScalarType(fieldSchemaType);
        }
        return(
            <Field
                labelClass="sr-only"
                label={ label }
                name={fieldName}
                type={ fieldType }
                validate={ (ctx, value) => validateSearch(value) }
            />
        );
    });
}
