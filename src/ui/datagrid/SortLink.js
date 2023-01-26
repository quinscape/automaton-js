import React from "react"
import cx from "classnames"
import { Icon } from "domainql-form"
import { operation } from "../../FilterDSL";
import findSort from "./findSort";
import i18n from "../../i18n"


/**
 * Finds the current column in the fields of the given sort order and returns `1` for ascending sort and `2` for
 * descending sort
 *
 * @param {Array<String|object>} sortFields     Array of sort field expression strings/maps
 * @param {String|object} sort                sort expression
 *
 * @return {number} 0 = not found, 1 = ascending, 2 = descending
 */

const SORT_ICONS = [ "fa-space", "fa-sort-down", "fa-sort-up"];


function descending(sort)
{
    if (typeof sort === "string")
    {
        return "!" + sort;
    }
    else
    {
        return operation("desc", [sort]);
    }
}

function getLabelForState(sortState)
{
    if (sortState)
    {
        if (sortState === 1)
        {
            return i18n("SortLink:Sorted Ascending")
        }
        else
        {
            return i18n("SortLink:Sorted Descending")
        }
    }
    return null
}


const SortLink = props => {

    const { iQuery, column } = props;
    const { heading, sort, sortable } = column;

    const { sortFields } = iQuery.queryConfig;

    const changeSorting = () => iQuery.update({
        sortFields: [
            // we only want the inverse column sorting if the current column was the only column sorted by. If we come
            // from a multi-field sorting, we sort by the current column in ascending direction first
            sortFields != null &&
            sortFields.length === 1 &&
            findSort(sortFields, sort) === 1 ?
                descending(sort) :
                sort
        ],
        offset: 0
    });

    let sortIcon = null
    let sortState = 0
    if (sortable && sortFields != null)
    {
        sortState = findSort(sortFields, sort)
        sortIcon = SORT_ICONS[sortState]
    }

    return (
        React.createElement(
            sortable ? "a" : "span",
            sortable ? {
                className: "d-block text-center text-dark",
                href: "#",
                role: "button",
                "aria-label":
                    // we only do the inverse column sorting if the current column was the only column sorted by.
                    // If we come from a multi-field sorting, we sort by the current column in ascending order first
                    sortFields != null &&
                    sortFields.length === 1 &&
                    sortState === 1 ?
                        i18n("SortLink:Sort by {0} descending", heading) :
                        i18n("SortLink:Sort by {0} ascending", heading),
                onClick: ev => { ev.preventDefault() ; changeSorting() }
            } : {
                className: "d-block text-center text-dark",
            },
            heading,
            sortable && <Icon
                aria-label={ getLabelForState(sortState) }
                className={
                    cx(
                        "sort-icon p-1 text-primary",
                        sortIcon
                    )
                }
            />
        )
    );
};

export default SortLink;
