import { operation, Type } from "../../FilterDSL";
import compareConditions from "../../util/compareConditions";

/**
 * Finds the current sort string/map in the given array of sort fields and returns `1` for ascending sort and `2` for
 * descending sort
 *
 * @param {Array<String|object>} sortFields     Array of sort field expression strings/maps
 * @param {String|object} sort                sort expression
 *
 * @return {number} 0 = not found, 1 = ascending, 2 = descending
 */
export default function findSort(sortFields, sort)
{
    for (let i = 0; i < sortFields.length; i++)
    {
        const current = sortFields[i];

        const sortIsString = typeof sort === "string";
        const currentIsString = typeof current === "string";

        const inverseSort = sortIsString ? "!" + sort : operation("desc", [sort]);

        if (sortIsString)
        {
            if (currentIsString)
            {
                if (current === sort)
                {
                    return 1;
                }
                else if (current === inverseSort)
                {
                    return 2;
                }
            }
            else
            {
                if (current.type === Type.FIELD && current.name === sort)
                {
                    return 1;
                }
                else if (
                    current.type === Type.OPERATION && current.name === "desc" &&
                    current.operands[0].type === Type.FIELD && current.operands[0].name === sort
                )
                {
                    return 2;
                }
            }
        }
        else
        {
            if (currentIsString)
            {
                if (sort.type === Type.FIELD && sort.name === current)
                {
                    return 1;
                }
                else if (
                    sort.type === Type.FIELD &&
                    current[0] === "!" &&
                    sort.name === current.substr(1)
                )
                {
                    return 2;
                }
            }
            else
            {
                if (compareConditions(current, sort))
                {
                    return 1;
                }
                else if (compareConditions(current, inverseSort))
                {
                    return 2;
                }
            }
        }
    }
    return 0;
}
