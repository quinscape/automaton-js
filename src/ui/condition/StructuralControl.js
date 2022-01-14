import React from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite";
import { ButtonToolbar } from "reactstrap";
import i18n from "../../i18n";
import { Icon } from "domainql-form";

const StructuralControl = observer(({condition, path}) => {

    const label = i18n("ConditionEditor:Add Row");

    return (
        <ButtonToolbar>
            <button
                type="button"
                className="btn btn-light"
                aria-label={ label }
                title={ label }
                onClick={ () => console.log("ADD") }
                >
                <Icon className="fa-plus"/>
            </button>
        </ButtonToolbar>
    );
});

export default StructuralControl;
