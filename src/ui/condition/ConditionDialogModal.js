import React, { useEffect, useRef, useState } from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite";
import { ButtonGroup, ButtonToolbar, ListGroup, ListGroupItem, Modal, ModalBody, ModalHeader } from "reactstrap";
import i18n from "../../i18n";
import { CONDITION_METHODS, FIELD_CONDITIONS } from "../../FilterDSL";
import { Icon } from "domainql-form";
import * as PropTypes from "prop-types";

const CONDITION_NAMES = [ ... Object.keys(CONDITION_METHODS), ... Object.keys(FIELD_CONDITIONS)];
//const OPERATION_NAMES = [ ... Object.keys(CONDITION_METHODS), ... Object.keys(FIELD_CONDITIONS)];

CONDITION_NAMES.sort();
//OPERATION_NAMES.sort();

function DefaultHelper({conditionDialog, defaultName, groupRef})
{
    useEffect(
        () => {
            console.log("EFX", groupRef)
            if (conditionDialog && groupRef.current)
            {
                const buttons = [... groupRef.current.querySelectorAll(".list-group-item button")];
                console.log("BUTTONS", buttons)
                const defaultBtn = buttons.find( item => item.firstChild.textContent === defaultName );



                if (defaultBtn)
                {

                    console.log("DEFAULT", defaultBtn)
                    defaultBtn.focus();
                }
            }
        },
        []
    )

    return false;
}


DefaultHelper.propTypes = {groupRef: PropTypes.any};


function ConditionInput({name, setName, conditionDialog})
{
    const inputRef = useRef(null)

    useEffect(
        () => {
            if (conditionDialog && inputRef.current)
            {
                inputRef.current.focus()
            }

        },
        [conditionDialog]
    )

    return (
        <input
            ref={ inputRef }
            id="condition-dialog-name-field"
            className="form-control"
            value={ name }
            onChange={ ev => setName(ev.target.value) }
            placeholder={ i18n("ConditionEditor:Condition name")}
            autoFocus={ true }
        />

    );
}


ConditionInput.propTypes = {
    setName: PropTypes.func,
    conditionDialog: PropTypes.any,
    name: PropTypes.string
};
const ConditionDialogModal = observer(({onSelect, conditionDialog, toggleConditionDialog, defaultName}) => {

    const [name, setName ] = useState("")

    const groupRef = useRef(null);

    const selectName = name => {
        onSelect(name)
        toggleConditionDialog();
    }

    return (
        <Modal isOpen={ !!conditionDialog } toggle={ toggleConditionDialog } size="lg" fade={ false }>
            <ModalHeader
                toggle={ toggleConditionDialog }
            >
                {
                    conditionDialog === 1 ? i18n("ConditionEditor:Add Condition") : i18n("ConditionEditor:Change Condition")
                }
            </ModalHeader>
            <ModalBody>
                {
                    !!conditionDialog && (
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col">
                                    <div className="form-group">
                                        <label htmlFor="condition-dialog-name-field">Name</label>
                                        <ConditionInput
                                            conditionDialog={ conditionDialog }
                                            name={ name }
                                            setName={ setName }
                                        />
                                    </div>
                                    <div
                                        ref={ groupRef }
                                        className="list-group"
                                    >
                                        {
                                            CONDITION_NAMES
                                                .filter( n => !n || n.toLowerCase().indexOf(name.toLowerCase()) >= 0)
                                                .slice(0, 10)
                                                .map(
                                                    n => (
                                                        <ListGroupItem
                                                            key={n}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="btn btn-link"
                                                                onClick={ () => selectName(n) }
                                                            >
                                                                { n }
                                                            </button>
                                                        </ListGroupItem>
                                                    )
                                                )
                                        }

                                    </div>
                                    <ButtonToolbar>
                                        <button
                                            type="button"
                                            className="btn btn-primary mr-1"
                                            disabled={ CONDITION_NAMES.indexOf(name) < 0 }
                                            onClick={ () => selectName(name)}
                                        >
                                            {
                                                i18n("Ok")
                                            }
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary mr-1"
                                            onClick={ toggleConditionDialog }
                                        >
                                            {
                                                i18n("Cancel")
                                            }
                                        </button>

                                    </ButtonToolbar>


                                </div>
                            </div>
                        </div>
                    )
                }
            </ModalBody>
        </Modal>
    );
});

export default ConditionDialogModal;
