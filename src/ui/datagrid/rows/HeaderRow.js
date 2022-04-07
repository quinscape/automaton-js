import React from "react"
import SortLink from "../SortLink";

const HeaderRow = ({
    value,
    columns,
    sortColumn
}) => {
    return (
        <tr className="headers">
            {
                columns.map(
                    (column, columnIdx) => {
                        const {name, enabled, width, minWidth, maxWidth} = column;
                        if (enabled) {
                            if (sortColumn != null) {
                                return (
                                    <th
                                        key={ columnIdx }
                                        style={
                                            {
                                                width: sortColumn === name ? "34px" : width,
                                                minWidth: sortColumn === name ? "34px" : minWidth,
                                                maxWidth: sortColumn === name ? "34px" : maxWidth
                                            }
                                        }
                                    >
                                        {
                                            sortColumn === name ? "" : column.heading
                                        }
                                    </th>
                                );
                            } else {
                                return (
                                    <th
                                        key={ columnIdx }
                                        style={
                                            {
                                                width: width,
                                                minWidth: minWidth,
                                                maxWidth: maxWidth
                                            }
                                        }
                                    >
                                        <SortLink
                                            iQuery={ value }
                                            column={ column }
                                        />
                                    </th>
                                );
                            }
                        }
                })
            }
        </tr>
    );
};

HeaderRow.displayName = "HeaderRow";

export default HeaderRow
