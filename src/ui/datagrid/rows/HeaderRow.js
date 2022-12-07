import React from "react"
import SortLink from "../SortLink";

const SORT_COLUMN_WIDTH = "34px";

const HeaderRow = ({
    value,
    columns,
    moveRowColumn
}) => {
    return (
        <tr className="data-grid-row headers">
            {
                columns.map(
                    (column, columnIdx) => {
                        const {name, enabled, width, minWidth, maxWidth} = column;
                        if (enabled) {
                            if (moveRowColumn != null) {
                                const isMoveRowColumn = moveRowColumn === name;
                                return (
                                    <th
                                        key={ columnIdx }
                                        style={
                                            {
                                                width: isMoveRowColumn ? SORT_COLUMN_WIDTH : width,
                                                minWidth: isMoveRowColumn ? SORT_COLUMN_WIDTH : minWidth,
                                                maxWidth: isMoveRowColumn ? SORT_COLUMN_WIDTH : maxWidth
                                            }
                                        }
                                    >
                                        <span className="d-block text-center text-dark">
                                            {
                                                isMoveRowColumn ? "" : column.heading
                                            }
                                        </span>
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
