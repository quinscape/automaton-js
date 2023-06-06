import {registerCustomFilter} from "./CustomFilter";
import {field, value} from "../../../filter";
import { parseSearch, stringifySearch } from "../converter/SearchStringConverter";
import { extractValueNodes } from "../../ui/datagrid/GridStateForm";
import i18n from "../../i18n";

/**
 * Creates and registers the filter for pattern input.
 * 
 * Filter rules are as follows:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "/"
 * - "not" is written as "!"
 * - no brackets
 * - "and" binds stronger than "or"
 * - if there is no expression, just match as contains
 */
export function registerLikePatternFilter()
{
    registerCustomFilter("likePattern", (fieldName, val) => {
        if (val == null || val === "") {
            return null
        }
        const stringValue = val.toString();
        const regExpString = parseSearch(stringValue);
        return field(fieldName).toString().likeRegex(value(regExpString, "String"));
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
    }, (fieldName) => field(fieldName).toString().likeRegex(value(null, "String")));
}
