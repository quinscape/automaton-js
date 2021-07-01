import React, { useMemo } from "react"
import cx from "classnames"
import config from "../../config";
import { getFields, unwrapAll, unwrapNonNull } from "../../util/type-utils";
import i18n from "../../i18n";
import { INPUT_OBJECT, LIST, OBJECT, SCALAR } from "domainql-form/lib/kind";
import  { Icon } from "domainql-form";
import { observer as fnObserver } from "mobx-react-lite";

function join(path, name)
{
    if (path)
    {
        return path + "." + name;
    }
    return name;
}

const TYPE_ORDER = [ SCALAR, OBJECT, INPUT_OBJECT, LIST ];

function sortByTypeAndName(a, b)
{

    const typeAPrio = TYPE_ORDER.indexOf(unwrapNonNull(a.type).kind);
    const typeBPrio = TYPE_ORDER.indexOf(unwrapNonNull(b.type).kind);

    if (typeAPrio < typeBPrio)
    {
        return -1;
    }
    else if (typeAPrio > typeBPrio)
    {
        return 1;
    }
    else
    {
        return a.name.localeCompare(b.name);
    }

}


const FieldSelector = fnObserver(({node, path = "", level = 0, fieldFilter, setFieldFilter, editorState}) => {

    const fields = useMemo(
        () => {
            const typeDef = config.inputSchema.getType(node);
            const fields = getFields(typeDef).slice();
            fields.sort(sortByTypeAndName)




            return fields;
        },
        []

    )

    const isRoot = level === 0;

    return (
        <>
            <div
                className={
                    cx(isRoot && "border p-3")
                }
                style={
                    isRoot ? ({
                        maxHeight: "20em",
                        overflowX: "hidden",
                        overflowY: "scroll"
                    }) : null
                }
            >
                <div className="row mt-2 mb-2">
                    <div className="col">
                        {
                            React.createElement(
                                isRoot ? "h5" : "h6",
                                {
                                    style:
                                        {
                                            paddingLeft: (level * 2) + "ex"
                                        }

                                },
                                <Icon className="fa-database mr-1 text-primary"/>,
                                i18n(node)
                            )
                        }
                    </div>
                </div>
                {
                    fields
                        .filter(e => !fieldFilter || e.name.toLowerCase().indexOf(fieldFilter.toLowerCase()) >= 0 || e.description.toLowerCase().indexOf(fieldFilter.toLowerCase()) >= 0)
                        .map(({ name, type, description}) => {


                        const unwrapped = unwrapAll(type);

                        const fieldPath = join(path, name);
                        const checkboxId = "field-selector:" + fieldPath;

                        const isSelected = editorState.fields.has(fieldPath);

                        const longLimit = 50;

                        const isLong = description.length > longLimit;


                        return (
                            <React.Fragment
                                key={ name }
                            >
                                <div
                                    className="d-flex text-nowrap"
                                >
                                    <div className="flex-nowrap">
                                        <div
                                            className="form-check form-check-inline"
                                            style={{
                                                paddingLeft: (level * 2) + "ex"
                                            }}
                                        >
                                            <input
                                                id={checkboxId}
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={ isSelected }
                                                onChange={
                                                    ev => editorState.toggleFieldSelection(fieldPath)
                                                }
                                            />
                                            <label className="form-check-label mt-0" htmlFor={checkboxId}>
                                                {
                                                    i18n(node + ":" + name)
                                                }
                                            </label>
                                        </div>
                                        <div className="d-inline-block">
                                            {
                                                description && (
                                                    <span>
                                                        <span
                                                            className="text-muted"
                                                            title={ isLong ? description : null }
                                                        >
                                                            {
                                                                isLong ? description.slice(0, longLimit) + "…" : description
                                                            }
                                                        </span>
                                                    </span>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                                {
                                    isSelected && unwrapped.kind !== SCALAR && (
                                        <FieldSelector
                                            node={ unwrapped.name }
                                            path={ fieldPath }
                                            level={level + 1}
                                            editorState={ editorState }
                                            fieldFilter={ fieldFilter }
                                            setFieldFilter={ null /* shouldn't set the filter on levels > 0*/}
                                        />
                                    )
                                }
                            </React.Fragment>
                        )
                    })
                }
            </div>
        </>
    );
});

export default FieldSelector;
