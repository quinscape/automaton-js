import React from "react"
import { observer as fnObserver } from "mobx-react-lite";
import i18n from "../../i18n";
import config from "../../config";
import { ButtonToolbar, Modal, ModalBody, ModalHeader } from "reactstrap"
import { Form, TextArea } from "domainql-form";
import { CONDITION_METHODS, FIELD_CONDITIONS, FIELD_OPERATIONS, Type } from "../../FilterDSL";
import { SCALAR } from "domainql-form/lib/kind";
import { lookupType } from "../../util/type-utils";


function parseJSON(value)
{

    try
    {
        return JSON.parse(value);
    }
    catch(e)
    {
        return undefined;
    }
}

function join(parent, name)
{
    if (parent)
    {
        return parent + "." + name;
    }
    return name;
}



function validate(editorState, node, path = "")
{
    const { type, name } = node;
    const isCondition = type === Type.CONDITION;
    const isOperation = type === Type.OPERATION;

    if (isCondition && !FIELD_CONDITIONS[name] && !CONDITION_METHODS[name])
    {
        return "Invalid condition '" + name + "' at " + join(path, "name");
    }
    if (isOperation && !FIELD_OPERATIONS[name])
    {
        return "Invalid operation '" + name + "' at " + join(path, "name");
    }

    if (isCondition || isOperation)
    {
        const { operands } = node;
        for (let i = 0; i < operands.length; i++)
        {
            const err =validate(editorState, operands[i], join(path, "operands[" + i + "]"));
            if (err !== null)
            {
                return err;
            }
        }
    }
    else if (type === Type.FIELD)
    {
        let fieldType;
        try
        {
            fieldType = lookupType(editorState.root, name);
        }
        catch(e)
        {
            // ignore
        }

        if (!fieldType)
        {
            return "Invalid field reference '" + name + "'";
        }
    }
    else if (type === Type.VALUES || type === Type.VALUE)
    {
        const { scalarType } = node;

        const def = config.inputSchema.getType(scalarType);

        if (!def || def.kind !== SCALAR)
        {
            return "Invalid scalar type '" + scalarType + "' at " + join(path, "scalarType")
        }
    }
    else
    {
        return "Invalid condition node at "+ path;
    }

    return null;
}


const ConditionJSONDialog = fnObserver(({editorState}) => {

    const toggle = editorState.toggleJSONDialog;

    return (
        <Modal isOpen={ editorState.json.isOpen } toggle={ toggle } size="lg" fade={ config.processDialog.props.fade }>
            <ModalHeader
                toggle={ toggle }
            >
                {
                    i18n("JSON Import/Export")
                }
            </ModalHeader>
            <ModalBody>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col">
                            <Form value={editorState}>
                                <TextArea
                                    name="json.json"
                                    inputClass="text-monospace"
                                    type="String"
                                    cols={ 80}
                                    rows={ 16 }
                                    validate={ ((ctx, value) => {

                                        const data = parseJSON(value);
                                        if (data === undefined)
                                        {
                                            return i18n("Invalid JSON");
                                        }
                                        const err = validate(editorState, data);

                                        if (!err)
                                        {
                                            editorState.setNodeValue("", data);
                                        }

                                        return err;
                                    })}
                                />
                            </Form>
                            <ButtonToolbar>
                                <button
                                    type="button"
                                    className="btn btn-secondary mr-1"
                                    onClick={ toggle }
                                >
                                    {
                                        i18n("Close")
                                    }
                                </button>
                            </ButtonToolbar>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
});

export default ConditionJSONDialog;
