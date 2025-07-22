import React from "react"
import cx from "classnames"
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
                        const { name, enabled, fixed, width, minWidth, maxWidth } = column;
                        if (enabled) {
                            if (moveRowColumn != null) {
                                const isMoveRowColumn = moveRowColumn === name;
                                return (
                                    <th
                                        key={ columnIdx }
                                        className="sticky-cell"
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
                                        className={cx(
                                            fixed && "sticky-cell"
                                        )}
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
