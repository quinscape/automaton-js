import {registerCustomFilter} from "./CustomFilter";
import {field, value} from "../../../filter";

export function registerNumberFilter()
{
    registerCustomFilter("ContainsNumber", (fieldName, val) => {
        return field(fieldName).toString()
            .containsIgnoreCase(value(val, "String"))
    });
}