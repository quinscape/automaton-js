import React from "react"
import cx from "classnames"
import Icon from "../Icon";


/**
 * Finds the current column in the fields of the given sort order and returns `1` for ascending sort and `2` for
 * descending sort
 *
 * @param {Object} sortOrder    SortOrder structure
 * @param {String} column       column name
 *
 * @return {number} 0 = not found, 1 = ascending, 2 = descending
 */
function findSort(sortOrder, column)
{
    const inverseColumn = "!" + column;

    const { fields } = sortOrder;

    for (let i = 0; i < fields.length; i++)
    {
        const field = fields[i];
        if (field === column)
        {
            return 1;
        }
        else if (field === inverseColumn)
        {
            return 2;
        }
    }
    return 0;
}

const SORT_ICONS = [ "fa-space", "fa-sort-down", "fa-sort-up"];

const SortLink = props => {

    const { iQuery, column, text, sortable } = props;

    const { sortOrder } = iQuery.queryConfig;

    const changeSorting = () => iQuery.update({
        sortOrder: {
            fields: [ (
                // we only want the inverse column sorting if the current column was the only column sorted by. If we come
                // from a multi-field sorting, we sort by the current column in ascending direction first
                sortOrder.fields.length === 1 &&
                findSort(sortOrder, column) === 1 ?
                    "!" + column :
                    column
            ) ]
        },
        currentPage: 0
    });

    const sortIcon = SORT_ICONS[ findSort(sortOrder, column) ];
    
    return (
        React.createElement(
            sortable ? "a" : "span",
            sortable ? {
                className: "d-block text-center text-dark",
                href: "#",
                onClick: changeSorting
            } : {
                className: "d-block text-center text-dark",
            },
            text,
            <Icon
                className={
                    cx(
                        "float-right p-1 text-primary",
                        sortIcon
                    )
                }
            />
        )
    );
};

export default SortLink;
