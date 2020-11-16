import React, { useMemo, useRef } from "react"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite";
import i18n from "../../i18n";
import config from "../../config";
import { SCALAR } from "domainql-form/lib/kind";
import { ButtonToolbar } from "reactstrap";
import { Icon } from "domainql-form";

const ValueTypeDialog = fnObserver(({dialog}) => {

    const { inputSchema } = config;

    const ref = useRef(null);

    const types = useMemo(
        () => {

            const types = inputSchema.schema.types.filter(t => t.kind === SCALAR).map(({name}) => name);
            types.sort();
            return types;
        },
        []
    )

    return (
        <>
            <form>
                <div className="form-group">
                    <label htmlFor="valueTypeSelect">Value Type</label>
                    <select ref={ref} className="form-control" id="valueTypeSelect" aria-describedby="valueTypeHelpBlock">
                        {
                            types.map(name => (
                                <option
                                    key={name}
                                >
                                    {
                                        name
                                    }
                                </option>
                            ))
                        }
                    </select>
                    <small id="valueTypeHelpBlock" className="form-text text-muted">
                        {
                            i18n("Automatic Type Detection Failed. Please Specify Scalar Type.")
                        }
                    </small>
                </div>
            </form>
            <ButtonToolbar>
                <button
                    type="button"
                    className="btn btn-secondary mr-1"
                    onClick={ () => dialog.cancel() }
                >
                    <Icon className="fa-cancel"/>
                    {
                        i18n("Cancel")
                    }
                </button>
                <button
                    type="button"
                    className="btn btn-primary mr-1"
                    onClick={ () => dialog.confirm(ref.current.value) }
                >
                    <Icon className="fa-ok"/>
                    {
                        i18n("Set Value Type")
                    }
                </button>
            </ButtonToolbar>
        </>
    );
});

export default ValueTypeDialog;
