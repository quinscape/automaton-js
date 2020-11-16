import { GlobalConfig } from "domainql-form";
import cx from "classnames";
import i18n from "../../i18n";
import React from "react";
import { getCount, renderValue, Sub } from "./JsonTable";
import { observer as fnObserver } from "mobx-react-lite";


const DataRow = ({row, index, subActive, setSubActive, columns, editorState}) => (
    <tr>
        {
            columns.map((col, colIdx) => {

                const count = getCount(row[col.name]);

                return (
                    <td
                        key={col.name}
                    >
                        {
                            col.scalar ? (
                                row ?
                                    renderValue(col.type, row[col.name]) :
                                    GlobalConfig.none()
                            ) : (
                                <button
                                    type="button"
                                    className={
                                        cx("btn btn-secondary", colIdx === subActive.column && "active")
                                    }
                                    aria-pressed={colIdx === subActive.column}
                                    disabled={ count === 0 }
                                    onClick={
                                        () => setSubActive(new Sub(col.name, index, colIdx))
                                    }
                                >
                                    {
                                        i18n("{0} rows", count)
                                    }
                                </button>
                            )
                        }
                    </td>
                );
            })
        }
    </tr>
);

export default fnObserver(DataRow)
