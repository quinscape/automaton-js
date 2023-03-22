import React, { useEffect, useRef } from "react"
import { observer, observer as fnObserver } from "mobx-react-lite";
import i18n from "../../i18n";
import config from "../../config";
import { ButtonToolbar, Modal, ModalBody, ModalHeader } from "reactstrap"
import { renderLayoutNodes } from "./ConditionEditor";
import { Form, FormContext, FormLayout } from "domainql-form";
import { AABB } from "./condition-layout";
import ConditionEditorState from "./ConditionEditorState";
import OperationDialog from "./OperationDialog";


const ExpressionDialogBody = observer(function ExpressionDialogBody({ editorState, conditionRoot, formContext, formOptions, valueRenderer, schemaResolveFilterCallback  })
{
    const nodes = [];
    const decorations = [];

    const { expression, operationPointer, opts, expressionTree } = editorState

    const containerRef = useRef(null)

    useEffect(
        () => {

            console.log("LAYOUT EXPR TREE, root #", FormContext.getUniqueId(layoutRoot))

            expressionTree.updateDimensions(containerRef.current);

            const newRoot = expressionTree.layoutRoot;

            let aabb = new AABB();
            if (newRoot)
            {
                expressionTree.layout(newRoot);
                newRoot.each(
                    node => {

                        // dimension is oriented right
                        const { width, height } = expressionTree.getDimension(
                            ConditionEditorState.getNodeId(node.data)
                        )
                        // rotate 90 degree ccw and mirror on the x axis
                        let { right : x, y } = node;
                        let tmp = x;
                        // noinspection JSSuspiciousNameCombination
                        x = y;
                        y = tmp - height;

                        aabb.add(x, y);
                        aabb.add(x + width, y + height);
                    }
                )

            }
            else
            {
                aabb.add(0, 0);
            }

            //console.log("AABB", aabb)
            expressionTree.updateAABB(aabb)
        },
        [ expressionTree.layoutCounter ]
    )

    const { layoutRoot, aabb } = expressionTree

    renderLayoutNodes(layoutRoot, nodes, decorations, expression, { editorState, tree: expressionTree, valueRenderer, schemaResolveFilterCallback })

    return ((
        <div
            ref={ containerRef }
            className="container-fluid"
        >
            <div className="row">
                <div className="col">
                    <Form
                        key={ FormContext.getUniqueId(conditionRoot) }
                        value={ conditionRoot }
                        formContext={ formContext }
                        options={ {
                            layout: FormLayout.INLINE
                        } }
                    >
                        {
                            formConfig => {
                                return (
                                    <div className="condition-editor-expression-dialog">
                                        <svg width={ aabb && aabb.width} height={ aabb && aabb.height } >
                                            {
                                                opts.extraSVG()
                                            }
                                            {
                                                !!decorations.length && decorations
                                            }
                                        </svg>
                                        {
                                            !!nodes.length && nodes
                                        }
                                    </div>
                                )
                            }
                        }
                    </Form>
                </div>
            </div>
            {
                operationPointer && (
                    <OperationDialog
                        editorState={ editorState }
                        formContext={ formContext }
                        conditionRoot={ conditionRoot }
                        formOptions={ formOptions }
                    />
                )
            }
        </div>
    ));
})


const ExpressionDialog = fnObserver(function ExpressionDialog({ editorState, conditionRoot, formContext, valueRenderer, schemaResolveFilterCallback }){

    const { closeExpressionDialog } = editorState;

    const isOpen = editorState.expressionDialogOpen;
    return (
        <Modal
            isOpen={ isOpen }
            toggle={ closeExpressionDialog }
            size="lg"
            fade={ config.processDialog.props.fade }
        >
            <ModalHeader
                toggle={ closeExpressionDialog }
            >
                {
                    i18n("ConditionEditor:Expressions")
                }
            </ModalHeader>
            <ModalBody>
                {
                    isOpen && (
                        <ExpressionDialogBody
                            editorState={ editorState }
                            conditionRoot={ conditionRoot }
                            formContext={ formContext }
                            valueRenderer={ valueRenderer }
                            schemaResolveFilterCallback={ schemaResolveFilterCallback }
                        />
                    )
                }
            </ModalBody>
        </Modal>
    );
});

export default ExpressionDialog;
