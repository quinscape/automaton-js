import {registerCustomFilter} from "./CustomFilter";
import {and, field, value} from "../../../filter";

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
            return null;
        }
        const sqlStartDate = startDate.toSQLDate() + "T00:00:00Z";
        const sqlEndDate = (endDate?.toSQLDate() ?? startDate.toSQLDate()) + "T23:59:59Z";

        return and(
            field(fieldName).ge(
                value(sqlStartDate, "Timestamp")
            ),
            field(fieldName).le(
                value(sqlEndDate, "Timestamp")
            )
        )
    });
}