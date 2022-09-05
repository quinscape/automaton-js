import {registerCustomFilter} from "./CustomFilter";
import {and, field, value} from "../../../filter";
import { DateTime } from "luxon";
import { extractValueNodes } from "../../ui/datagrid/GridStateForm";
import i18n from "../../i18n";

/**
 * Creates and registers the filter for date ranges.
 */
export function registerDateRangeFilter()
{
    registerCustomFilter("DateRange", (fieldName, val) => {
        const [
            startDate,
            endDate
        ] = val ?? [];

        if (!startDate) {
            return field(fieldName).between(
                value(null, "Timestamp"),
                value(null, "Timestamp")
            );
        }

        const sqlStartDate = DateTime.fromObject({
            year: startDate.year,
            month: startDate.month,
            day: startDate.day,
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        }, {
            zone: endDate.zone
        }).toUTC().toISO();

        const sqlEndDate = endDate == null ? sqlStartDate : DateTime.fromObject({
            year: endDate.year,
            month: endDate.month,
            day: endDate.day,
            hour: 23,
            minute: 59,
            second: 59,
            millisecond: 999
        }, {
            zone: endDate.zone
        }).toUTC().toISO();

        return field(fieldName).between(
            value(sqlStartDate, "Timestamp"),
            value(sqlEndDate, "Timestamp")
        );
    }, (column, columnCondition) => {
        const valueNodes = extractValueNodes(columnCondition);
        if (valueNodes[0].value == null) {
            return [
                {
                    type: "Timestamp",
                    label: i18n("Filter:" + column.name),
                    value: [null, null]
                }
            ];
        }
        return [
            {
                type: "Timestamp",
                label: i18n("Filter:" + column.name),
                value: [
                    DateTime.fromISO(valueNodes[0].value),
                    DateTime.fromISO(valueNodes[1].value)
                ]
            }
        ];
    });
}