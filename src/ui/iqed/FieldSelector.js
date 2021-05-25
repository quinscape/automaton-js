import React, { useMemo } from "react"
import cx from "classnames"
import config from "../../config";
import { getFields, unwrapAll } from "../../util/type-utils";
import i18n from "../../i18n";
import { SCALAR } from "domainql-form/lib/kind";
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


const FieldSelector = fnObserver(({node, path = "", level = 0, fieldFilter, setFieldFilter, state}) => {

    const fields = useMemo(
        () => {
            const typeDef = config.inputSchema.getType(node);
            const fields = getFields(typeDef).slice();
            fields.sort((a,b) => {
                return a.name.localeCompare(b.name);
            })

            return fields;
        },
        []

    )

    return (
        <>
            {
                level === 0 && (
                    <div className="row mt-2 mb-2">
                        <div className="col">
                            <label htmlFor="field-selector-field-filter" className="sr-only" >Filter Fields</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text">
                                        <Icon className="fa-search"/>
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nach Feld-Name oder -Beschreibung filtern"
                                    value={ fieldFilter }
                                    onChange={ ev => setFieldFilter(ev.target.value) }
                                />
                            </div>

                        </div>
                    </div>
                )
            }
            <div className="row mt-2 mb-2">
                <div className="col">
                    {
                        React.createElement(
                            level === 0 ? "h5" : "h6",
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
            <div
                className="border p-3"
                style={ level === 0 ? ({
                maxHeight: "20em",
                overflowX: "hidden",
                overflowY: "scroll"
            }) : null }>
                {
                    fields
                        .filter(e => !fieldFilter || e.name.toLowerCase().indexOf(fieldFilter.toLowerCase()) >= 0 || e.description.toLowerCase().indexOf(fieldFilter.toLowerCase()) >= 0)
                        .map(({ name, type, description}) => {


                        const unwrapped = unwrapAll(type);

                        const fieldPath = join(path, name);
                        const checkboxId = "field-selector:" + fieldPath;

                        const isSelected = state.fields.has(fieldPath);

                        return (
                            <React.Fragment
                                key={ name }
                            >
                                <div
                                    className="row"
                                >
                                    <div className="col-3">
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
                                                    ev => state.toggleFieldSelection(fieldPath)
                                                }
                                            />
                                            <label className="form-check-label mt-0" htmlFor={checkboxId}>
                                                {
                                                    i18n(node + ":" + name)
                                                }
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-8">
                                        {
                                            description && (
                                                <span>
                                            -
                                            <span
                                                className="text-muted"
                                            >
                                                {
                                                    description
                                                }
                                            </span>
                                        </span>
                                            )
                                        }
                                    </div>
                                </div>
                                {
                                    isSelected && unwrapped.kind !== SCALAR && (
                                        <FieldSelector
                                            node={ unwrapped.name }
                                            path={ fieldPath }
                                            level={level + 1}
                                            state={ state }
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
