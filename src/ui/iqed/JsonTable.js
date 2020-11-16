import React, { useMemo, useState } from "react"
import { observer as fnObserver } from "mobx-react-lite";
import config from "../../config"
import { getFields, unwrapNonNull } from "../../util/type-utils";
import { LIST, SCALAR } from "domainql-form/lib/kind";
import i18n from "../../i18n";
import { GlobalConfig } from "domainql-form";
import { observable, toJS } from "mobx";
import DataRow from "./DataRow";

export function Sub(name, index, column)
{
    this.name = name;
    this.index = index;
    this.column = column;
}

const EMPTY = [];


export function getCount(value)
{
    if (Array.isArray(value))
    {
        return value.length;
    }
    return +(value !== null && value !== undefined);
}

export function renderValue(type, value)
{
    if (value === null || value === undefined)
    {
        return GlobalConfig.none();
    }
    else
    {
        return GlobalConfig.renderStatic(type, value);
    }

}


function join(path, name)
{
    if (path)
    {
        return path + "." + name;
    }
    return name;
}

let idCounter = 0;


export function tableId(path, index)
{
    return path + "[" + index + "]";
}


const JsonTable = (({ domainType, value, fields, path = "", level = 0, editorState }) => {

    //const id = useMemo( () => idCounter++, []);

    const [ subActive, setSubActive ] = useState(() => new Sub(null, -1, 0));

    const columns = useMemo(
        () => {

            const columns = [];

            const typeDef = config.inputSchema.getType(domainType);

            if (!typeDef)
            {
                throw new Error("Could not find type '" + domainType + "'");
            }

            const fieldDefs = getFields(typeDef);
            if (!fieldDefs)
            {
                throw new Error("No fields in type '" + domainType + "': typeDef = " + JSON.stringify(typeDef))
            }

            for (let i = 0; i < fieldDefs.length; i++)
            {
                const { name, type } = fieldDefs[i];

                const fieldPath = join(path, name);
                if (fields.has(fieldPath))
                {
                    const unwrapped = unwrapNonNull(type);
                    columns.push({
                        name,
                        path: fieldPath,
                        type: unwrapped.kind === LIST ? unwrapped.ofType.name : unwrapped.name,
                        scalar: unwrapped.kind === SCALAR
                    })
                }
            }

            columns.sort((a,b) => {
                const nameA = (a.scalar ? "A" : "B") + a.name;
                const nameB = (b.scalar ? "A" : "B") + b.name;
                return nameA.localeCompare(nameB);
            })

            return columns;
        },
        [ domainType ]
    )


    const rows = Array.isArray(value) ? value : observable.array([ value ]);

    const haveSelection = subActive.index >= 0;
    const endOfA = subActive.index + 1;
    const rowsA = haveSelection ? rows.slice(0, endOfA) : rows;
    const rowsB = haveSelection ? rows.slice(endOfA) : EMPTY;

    const tableStyles = {
        marginLeft: (level * 2) + "ex"
    };

    //console.log(id, "rows, subActive", toJS(rows), subActive);

    return (
        <>
            <table
                className="table table-hover table-striped table-bordered table-sm mt-3 mb-0"
                style={ tableStyles }
            >
                <thead>
                    <tr>
                        <th colSpan={ columns.length }>
                            {
                                i18n(domainType)
                            }
                        </th>
                    </tr>
                    <tr>
                        {
                            columns.map(col => (
                                <th
                                    key={ col.name }
                                >
                                    {
                                        i18n( domainType + ":" + col.name)
                                    }
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.length ? (
                            rowsA.map ( (row,index) => (
                                <DataRow
                                    key={ index }
                                    row={ row }
                                    index={ index }
                                    subActive={ subActive }
                                    setSubActive={ setSubActive }
                                    columns={ columns }
                                    editorState={ editorState }
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={ columns.length }>
                                    <span className="text-muted">
                                        {
                                            i18n("No Results")
                                        }
                                    </span>

                                </td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
            {
                haveSelection && (
                    <JsonTable
                        key={ subActive.index + ":" + subActive.name }
                        domainType={ columns[subActive.column].type }
                        value={ rows[subActive.index][subActive.name] }
                        fields={ fields }
                        path={ join(path, subActive.name) }
                        level={ level + 1 }
                        editorState={ editorState }
                    />
                )
            }
            {
                rowsB.length > 0 && (
                    <table
                        className="table table-hover table-striped table-bordered table-sm mt-3 mb-0"
                        style={ tableStyles }
                    >
                        <thead>
                        <tr>
                            <th colSpan={ columns.length }>
                                {
                                    i18n("{0} continued", i18n(domainType))
                                }
                            </th>
                        </tr>
                        <tr>
                            {
                                columns.map(col => (
                                    <th
                                        key={ col.name }
                                    >
                                        {
                                            i18n( domainType + ":" + col.name)
                                        }
                                    </th>
                                ))
                            }
                        </tr>
                        </thead>
                        <tbody>
                        {
                            rowsB.map ( (row,index) => (
                                <DataRow
                                    key={ index }
                                    row={ row }
                                    index={ endOfA + index  }
                                    subActive={ subActive }
                                    setSubActive={ setSubActive }
                                    columns={ columns }
                                    editorState={ editorState }
                                />
                            ))
                        }
                        </tbody>
                    </table>
                )
            }

        </>
    );
});

export default fnObserver(JsonTable);
