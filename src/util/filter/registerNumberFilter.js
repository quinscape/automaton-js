import {registerCustomFilter} from "./CustomFilter";
import {field, value} from "../../../filter";

/**
 * Creates and registers the filter for numbers.
 */
export function registerNumberFilter()
{
    registerCustomFilter("ContainsNumber", (fieldName, val) => {
        return field(fieldName).toString()
            .containsIgnoreCase(value(val, "String"))
    });
}