import {registerCustomFilter} from "./CustomFilter";
import {and, field, value} from "../../../filter";
import { DateTime } from "luxon";
import { extractValueNodes } from "../../ui/datagrid/GridStateForm";
import i18n from "../../i18n";

function convertDate(date) {
    return DateTime.fromObject({
        year: date.year,
        month: date.month,
        day: date.day,
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999
    }, {
        zone: date.zone
    }).toUTC().toISO();
}

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

        if (startDate == null && endDate == null) {
            return;
        }

        if (endDate == null) {
            const sqlStartDate = convertDate(startDate);
            return field(fieldName).ge(
                value(sqlStartDate, "Timestamp")
            );
        }

        if (startDate == null) {
            const sqlEndDate = convertDate(endDate);
            return field(fieldName).le(
                value(sqlEndDate, "Timestamp")
            );
        }

        
        const sqlStartDate = convertDate(startDate);
        const sqlEndDate = convertDate(endDate);

        return field(fieldName).between(
            value(sqlStartDate, "Timestamp"),
            value(sqlEndDate, "Timestamp")
        );
    }, (column, columnCondition) => {
        const valueNodes = extractValueNodes(columnCondition);
        const startValue = valueNodes?.[0]?.value;
        const endValue = valueNodes?.[1]?.value;
        return [
            {
                type: "Timestamp",
                label: i18n("Filter:" + column.name),
                value: [
                    startValue != null ? DateTime.fromISO(startValue) : null,
                    endValue != null ? DateTime.fromISO(endValue) : null
                ]
            }
        ];
    });
}