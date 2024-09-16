import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite"
import get from "lodash.get"

import { COMPUTED_VALUE_TYPE, field, toJSON, Type, value as dslValue } from "../../FilterDSL"
import { AABB, isStructuralCondition, join } from "./condition-layout"
import ConditionDropdown from "./ConditionDropdown"
import FieldSelect from "./FieldSelect"
import { Addon, Field, Form, FormContext, FormLayout, GlobalConfig, Icon } from "domainql-form"
import ConditionSelect from "./ConditionSelect"
import Leaf from "./Leaf"
import i18n from "../../i18n"
import { ButtonToolbar } from "reactstrap"
import ConditionEditorState, { TreeType } from "./ConditionEditorState"
import ImportExportDialog from "./ImportExportDialog"
import PropTypes from "prop-types"
import { action, runInAction, toJS } from "mobx"
import ExpressionDialog from "./ExpressionDialog"
import ExpressionDropdown from "./ExpressionDropdown"
import { getFieldDataByPath, getTableNameByPath } from "../../util/inputSchemaUtilities"
import renderFieldHelpers from "../../util/renderFieldHelpers"
import { unwrapAll } from "../../util/type-utils"
import ChangeValueTypeDialog from "./ChangeValueTypeDialog"
import ConditionPointer from "./ConditionPointer"


function minXOfChildren(layoutNode)
{
    let minX = Infinity;
    const { children } = layoutNode;
    if (children)
    {
        for (let i = 0; i < children.length; i++)
        {
            const kid = children[i];

            // noinspection JSSuspiciousNameCombination
            let { y: kidX } = kid;
            if (kidX < minX)
            {
                minX = kidX;
            }
        }
    }

    return minX;
}


const DEFAULT_OPTIONS = {
    rootType: null,
    allowFields: [],
    highlightedFields: [],
    reverseStructural: true,

    defaultCondition: () => toJSON(
        field("")
            .containsIgnoreCase(
                dslValue("")
            )
    ),

    /**
     * Artificial gap between the levels of the tree
     */
    levelGap: 24,

    /**
     * Spacing configuration value for d3-flexfree. Function takes 2 nodes and returns the spacing value.
     * @type {number|function}
     */
    spacing: 6,

    /**
     * Extra props for the decorator path. Determines color and stroke etc.
     */
    pathProps: {
        stroke : "#989898",
        strokeWidth: 2
    },

    /**
     * Renders extra SVG elements for the decorator path
     * @return {ReactElement|false} extra elements
     */
    extraSVG: () => false
}

const ConditionEditor = observer(function ConditionEditor(props) {
    const {
        rootType,
        pointer,
        className,
        options,
        formContext = FormContext.getDefault(),
        valueRenderer: valueRendererFromProps,
        schemaResolveFilterCallback,
        onChange,
        enableImportExport,
        queryCondition: queryConditionFromProps
    } = props;

    const valueRenderer = useMemo(() => {
        if (typeof valueRendererFromProps === "function") {
            return (pathName, nodeData = {}) => {
                const tablePathName = pathName.split(".").slice(0, -1).join(".");
                return valueRendererFromProps(pathName, {
                    ...nodeData,
                    rootType,
                    tableName: getTableNameByPath(rootType, tablePathName),
                    fieldData: getFieldDataByPath(rootType, pathName)
                });
            }
        }
    }, [rootType, valueRendererFromProps]);

    const onConditionChange = useMemo(() => {
        if (typeof onChange === "function") {
            return () => {
                const queryCondition = pointer.getValue();
                onChange(queryCondition);
            };
        } else {
            return () => {}
        }
    });

    const opts = useMemo(
        () => {

            const opts = {
                ... DEFAULT_OPTIONS,
                ... options,
                rootType
            };
            return opts
        },
        [
            rootType, ... options ? options.highlightedFields : []
        ]
    );

    const containerRef = useRef(null);


    const condition = pointer.getValue();

    const [editorState, setEditorState] = useState(new ConditionEditorState(rootType, pointer, opts));

    useEffect(() => {
        setEditorState(new ConditionEditorState(rootType, pointer, opts));
    }, [rootType, opts, pointer]);

    useEffect(() => {
        editorState.replaceCondition(queryConditionFromProps);
    }, [queryConditionFromProps]);

    useLayoutEffect(
        () => {
            if (editorState.revalidateCount)
            {
                console.log("REVALIDATE")
                formContext.removeAllErrors();
                formContext.revalidate();
            }
        },
        [ editorState.revalidateCount ]
    );

    const { layoutRoot, layoutCounter, aabb } = editorState.conditionTree;

    useEffect(
        () => {

            const onResize = () => {
                editorState.conditionTree.relayout()
                if (editorState.expressionDialogOpen)
                {
                    editorState.expressionTree.relayout()
                }
            };

            onResize();

            window.addEventListener("resize", onResize, true)

            return () => {
                window.removeEventListener("resize", onResize, true)
            }
        },
        []
    );

    useEffect(
        () => {

            editorState.conditionTree.updateDimensions(containerRef.current);

            const newRoot = editorState.conditionTree.layoutRoot;

            let aabb = new AABB();
            if (newRoot)
            {
                editorState.conditionTree.layout(newRoot);

                newRoot.each(
                    node => {

                        // dimension is oriented right
                        const { width, height } = editorState.conditionTree.getDimension(
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

            editorState.conditionTree.updateAABB(aabb)

            onConditionChange();
        },
        [ layoutCounter ]
    );

    const nodes = [];
    const decorations = [];

    renderLayoutNodes(layoutRoot, nodes, decorations, condition, { editorState, tree: editorState.conditionTree, valueRenderer, schemaResolveFilterCallback });

    return (
        <>
            <div
                key={ editorState.updateCounter }
                ref={ containerRef }
                className={ cx("condition-editor", className) }
            >
                <Form
                    key={ FormContext.getUniqueId(condition) + "-" + editorState.formCounter }
                    value={ condition }
                    formContext={ formContext }
                    options={ {
                        layout: FormLayout.INLINE,
                        onChange: onConditionChange
                    } }
                >
                    {
                        formConfig => {
                            return (
                                <>
                                    <svg width={ aabb && aabb.width} height={aabb && aabb.height} >
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
                                    {
                                        !condition && <>
                                            <p className="form-control-plaintext text-muted">
                                                {
                                                    i18n("ConditionEditor:No condition")
                                                }
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={
                                                    () => editorState.replaceCondition(
                                                        opts.defaultCondition()
                                                    )
                                                }
                                            >
                                                {
                                                    i18n("ConditionEditor:Add Condition")
                                                }
                                            </button>

                                        </>
                                    }
                                </>
                            )
                        }
                    }
                </Form>
                
                {
                    enableImportExport && (
                        <ButtonToolbar className="flex-row-reverse">
                            <button
                                type="button"
                                className="btn btn-link btn-sm"
                                onClick={ () => editorState.toggleImportExportOpen() }
                            >
                                {
                                    i18n("ConditionEditor:Import/Export")
                                }
                            </button>
                        </ButtonToolbar>
                    )
                }
                

            </div>

            <ImportExportDialog
                editorState={ editorState }
            />

            <ExpressionDialog
                conditionRoot={ condition }
                editorState={ editorState }
                formContext={ formContext }
                valueRenderer={ valueRenderer }
                schemaResolveFilterCallback={ schemaResolveFilterCallback }
            />

            <ChangeValueTypeDialog
                editorState={ editorState }
                formContext={ formContext }
                valueRenderer={ valueRenderer }
                schemaResolveFilterCallback={ schemaResolveFilterCallback }
            />
        </>
    );
});

///   NODE RENDERING ///////////////////////////////////////////////////////////////////////////////////////////////////

function StructuralAddButton({condition, pointer, editorState})
{

    return (
        <button
            type="button"
            className="ctrl btn btn-light btn-sm"
            onClick={() => {
                const newCondition = {
                    ... condition,
                    operands: [ ... condition.operands, editorState.opts.defaultCondition()]
                }
                editorState.replaceCondition(newCondition, pointer)
            }}
        >
            <Icon className="fa-plus"/>
        </button>
    );
}




/**
 * Creates flat React elements for the hierarchical component tree and adds them either to "nodes" which are normal
 * relative-absolute positioned HTML content and decorations which are SVG elements
 */
export function renderLayoutNodes(layoutNode, nodes, decorations, conditionRoot, ctx)
{
    const { editorState, tree } = ctx

    if (!layoutNode)
    {
        return;
    }

    const { rootType } = editorState;

    const { aabb } = tree;

    let offsetX = aabb ? aabb.minX : 0;
    let offsetY = aabb ? aabb.minY : 0;

    const isConditionTree = tree.type === TreeType.MAIN;

    const condition = layoutNode.data;
    const isStructural = isConditionTree ? isStructuralCondition(condition) : condition.type === Type.CONDITION || condition.type === Type.OPERATION;

    const nodeId = ConditionEditorState.getNodeId(condition);
    const path = editorState.pathLookup.get(nodeId);

    const pointer = editorState.pointer.createChild(path)

    if (isStructural)
    {
        if (aabb)
        {
            decorations.push(drawStructuralDecorator(layoutNode, tree, offsetX, offsetY))
        }


        nodes.push(
            <Leaf
                key={ nodeId }
                layoutNode={layoutNode}
                offsetX={offsetX}
                offsetY={offsetY}
                className="structural"
                tree={ tree }

            >
                 <span>
                    {
                        ( i18n(condition.name) || "component" )
                    }
                    {
                        condition.operands.every(o => isStructuralCondition(o)) && condition.name !== "not" && (
                            <StructuralAddButton
                                condition={ condition }
                                pointer={ pointer }
                                editorState={ editorState }
                            />
                        )
                    }
                </span>
                {
                    !isConditionTree && (
                        <ExpressionDropdown
                            key={ nodeId + "-dd" }
                            pointer={ pointer }
                            condition={ condition }
                            editorState={ editorState }
                        />
                     )
                }
            </Leaf>
        )

    }
    else
    {

        const elements = [];

        if (isConditionTree)
        {
            renderCondition(elements, layoutNode, layoutNode.data, pointer, ctx)
        }
        else
        {
            renderExpression(elements, layoutNode, layoutNode.data, pointer, ctx)
        }

        nodes.push(
            <Leaf
                key={ ConditionEditorState.getNodeId(layoutNode.data) }
                layoutNode={ layoutNode }
                offsetX={ offsetX }
                offsetY={ offsetY }
                className="condition"
                tree={ tree }
            >
                { elements }
            </Leaf>
        )
    }

    if (isStructural)
    {
        flattenStructuralKids(rootType, layoutNode, nodes, decorations, editorState, conditionRoot, ctx);
    }
}


function flattenStructuralKids(rootType, node, nodes, decorations, editorState, conditionRoot, ctx)
{
    const { children } = node;

    if (children)
    {
        for (let i = 0; i < children.length; i++)
        {
            const kid = children[i];
            renderLayoutNodes(kid, nodes, decorations, conditionRoot, ctx)
        }
    }
}

const jasperParamRE = /\$P\{([a-zA-Z0-9_]*?)}/

function renderCondition(elements, layoutNode, condition, pointer, ctx) {

    const { editorState, valueRenderer, schemaResolveFilterCallback } = ctx

    const { rootType } = editorState;

    const { type } = condition;

    const nodeId = ConditionEditorState.getNodeId(condition);

    const isCondition = type === Type.CONDITION;
    if (isCondition || type === Type.OPERATION)
    {
        const kids = [];
        const { operands } = condition;
        const unary = operands.length === 1;
        if (!unary)
        {
            renderCondition(kids, layoutNode, operands[0], pointer.getOperand(0), ctx)
        }

        kids.push(
            <span
                key={ nodeId + "kids"}
                className={cx(isCondition ? "cond" : "op", " mr-3")}
            >
                <ConditionSelect
                    condition={ condition }
                    pointer={ pointer }
                    editorState={ editorState }
                    isCondition={ condition.type === Type.CONDITION }
                />
            </span>
        )

        for (let i = unary ? 0 : 1; i < operands.length; i++)
        {
            renderCondition(kids, layoutNode, operands[i], pointer.getOperand(i), ctx)
        }

        if (isCondition)
        {
            kids.push(
                <ConditionDropdown
                    key={ nodeId + "-dd"}
                    pointer={ pointer }
                    condition={ condition }
                    editorState={ editorState }
                />
            )
        }

        elements.push(
            // local root of flattened operation/condition
            <span
                key={ nodeId }
                data-layout={ nodeId }
            >
                {
                    kids
                }

            </span>
        )
    }
    else if (type === Type.FIELD)
    {
        elements.push(
            <FieldSelect
                key={ nodeId }
                layoutId={ nodeId }
                rootType={ rootType }
                pointer={ pointer }
                editorState={ editorState }
                valueRenderer={ valueRenderer }
                schemaResolveFilterCallback={schemaResolveFilterCallback}
            />
        )
    }
    else if (type === Type.VALUE)
    {
        const { scalarType } = condition;

        const valuePath =  editorState.toRelativeFormPath(pointer, "value")
        if (scalarType === COMPUTED_VALUE_TYPE)
        {
            elements.push(
                <span
                    key={ pointer.path }
                    data-layout={ nodeId }
                    className="value mr-1"
                >
                    <Field
                        key={ pointer.path + ":" + scalarType }
                        name={ valuePath }
                        type={ COMPUTED_VALUE_TYPE + "!" }
                        labelClass="sr-only"
                        label={ i18n("ConditionEditor:Computed Value") }
                    >
                        <Addon placement={ Addon.RIGHT }>
                            <button
                                className="btn btn-light border"
                                title={ i18n("ConditionEditor:Computed Value") + "…" }
                                onClick={
                                    () => editorState.openComputedValueDialog(pointer)
                                }
                            >
                              <Icon className="fa-cog text-muted"/>
                            </button>
                        </Addon>
                    </Field>
                </span>
            )
        }
        else
        {
            elements.push(
                <span
                    key={ pointer.path }
                    data-layout={ nodeId }
                    className="value mr-1"
                >
                    <Field
                        key={ pointer.path + ":" + scalarType }
                        name={ valuePath }
                        type={ scalarType + "!" }
                        labelClass="sr-only"
                        label={ i18n("ConditionEditor:Filter value") }
                        required={ true }
                    >
                        {
                            renderFieldHelpers([
                                ({value, fieldContext}) => {

                                    if (unwrapAll(fieldContext.fieldType).name === "Timestamp" && value === "now")
                                    {
                                        return <button className="btn btn-light btn-sm" title={ i18n("ConditionHelper:Convert To Computed value") } onClick={ () => editorState.convertToComputed(condition, "now") }>
                                            <Icon className="fa-info-circle text-info"/>
                                        </button>;
                                    }
                                    return false
                                },
                                ({value, fieldContext}) => {

                                    if (unwrapAll(fieldContext.fieldType).name === "Date" && value === "today")
                                    {
                                        return <button className="btn btn-light btn-sm" title="Convert String value today to computed value" onClick={ () => editorState.convertToComputed(condition, "today") }>
                                            <Icon className="fa-info-circle text-info"/>
                                        </button>;
                                    }
                                    return false
                                },

                                // helper for Jasper parameter format to computed value param
                                ({value, fieldContext}) => {

                                    const m = jasperParamRE.exec(value)
                                    if (m)
                                    {
                                        return (
                                            <button
                                                className="btn btn-light btn-sm"
                                                title={ i18n("ConditionHelper:Convert To Computed Param") }
                                                onClick={
                                                    () => editorState.convertToComputed(
                                                        condition,
                                                        "param",
                                                        {
                                                                value: m[1],
                                                                type: "String"
                                                        }
                                                    ) }
                                            >
                                                <Icon className="fa-info-circle text-info"/>
                                            </button>
                                        );
                                    }
                                    return false
                                }
                            ])
                        }
                    </Field>
                </span>
            )
        }
    }
    else if (type === Type.VALUES)
    {
        const {scalarType, values} = condition;


        elements.push(
            <span
                key={ pointer.path }
                data-layout={nodeId}
                className="values mr-1"
            >
            </span>
        )

        elements.push(
            <div
                key={nodeId}
                data-layout={nodeId}
                className="values d-inline-block d-flex flex-column"
            >
                {
                    values.map((value, idx) => (
                        <span
                            key={ idx }
                        >
                            <Field
                                type={scalarType + "!"}
                                labelClass="sr-only"
                                label={ "Value #" + idx }
                                required={ true }
                                name={ editorState.toRelativeFormPath(pointer, "values." + idx) }
                                addons={[
                                    <Addon placement={ Addon.RIGHT }>
                                        <button
                                            type="button"
                                            className="btn btn-light border"
                                            aria-label={i18n("ConditionEditor:Remove")}
                                            onClick={ () => editorState.removeInValue(pointer, idx)}
                                            >
                                            <Icon className="fa-minus text-danger"/>
                                        </button>

                                    </Addon>
                                ]}
                            />
                        </span>
                    ))
                }
                <span>
                    <button
                        type="button"
                        className="btn btn-light border"
                        aria-label={i18n("ConditionEditor:Add")}
                        onClick={ () => runInAction(() => editorState.addInValue(pointer) ) }
                    >
                        <Icon className="fa-plus mr-1"/>
                        {
                            i18n("ConditionEditor:Add")
                        }
                    </button>
                </span>
            </div>
        )

    }
    else
    {
        throw new Error("Invalid condition node type: " + type);
    }
}

function renderExpression(elements, layoutNode, condition, pointer, ctx)
{
    const { editorState, valueRenderer, schemaResolveFilterCallback } = ctx

    const { rootType } = editorState;

    const { type } = condition;

    const nodeId = ConditionEditorState.getNodeId(condition);

    if (type === Type.FIELD)
    {
        elements.push(
            <FieldSelect
                key={ nodeId }
                layoutId={ nodeId }
                rootType={ rootType }
                pointer={ pointer }
                editorState={ editorState }
                valueRenderer={ valueRenderer }
                schemaResolveFilterCallback={schemaResolveFilterCallback}
            />
        )
    }
    else if (type === Type.VALUE)
    {
        const { scalarType } = condition;

        elements.push(
            <span
                key={ pointer.path }
                data-layout={nodeId}
                className="value mr-1"
            >
                <Field
                    key={ pointer.path + ":" + scalarType }
                    name={ editorState.toRelativeFormPath(pointer,"value") }
                    type={ scalarType + "!" }
                    labelClass="sr-only"
                    label="Filter value"
                    required={ true }
                />
            </span>
        )
    }
    else if (type === Type.VALUES)
    {
        const {scalarType, values} = condition;


        elements.push(
            <span
                key={ pointer.path }
                data-layout={nodeId}
                className="values mr-1"
            >
            </span>
        )

        elements.push(
            <div
                key={nodeId}
                data-layout={nodeId}
                className="values d-inline-block d-flex flex-column"
            >
                {
                    values.map((value, idx) => (
                        <span
                            key={ idx }
                        >
                            <Field
                                type={scalarType + "!"}
                                labelClass="sr-only"
                                label={ "Value #" + idx }
                                required={ true }
                                name={ editorState.toRelativeFormPath(pointer, "values" + idx) }
                                addons={[
                                    <Addon placement={ Addon.RIGHT }>
                                        <button
                                            type="button"
                                            className="btn btn-light border"
                                            aria-label={i18n("ConditionEditor:Remove")}
                                            onClick={ () => editorState.removeInValue(pointer, idx)}
                                        >
                                            <Icon className="fa-minus text-danger"/>
                                        </button>

                                    </Addon>
                                ]}
                            />
                        </span>
                    ))
                }
                <span>
                    <button
                        type="button"
                        className="btn btn-light border"
                        aria-label={i18n("ConditionEditor:Add")}
                        onClick={ () => runInAction(() => editorState.addInValue(pointer) ) }
                    >
                        <Icon className="fa-plus mr-1"/>
                        {
                            i18n("ConditionEditor:Add")
                        }
                    </button>
                </span>
            </div>
        )

    }
    else
    {
        throw new Error("Invalid condition node type: " + type);
    }

    elements.push(
        <ExpressionDropdown
            key={ nodeId + "-dd" }
            pointer={ pointer }
            condition={ condition }
            editorState={ editorState }
        />
    )

}


export function drawStructuralDecorator(layoutNode, tree, offsetX, offsetY)
{

    const { opts } = tree;

    const hGap = Math.floor(opts.levelGap / 2);
    let { right: x, y } = layoutNode;

    const dimension = tree.getDimension(ConditionEditorState.getNodeId(layoutNode.data));

    // rotate 90 degree ccw and mirror on the x axis
    let tmp = x;
    // noinspection JSSuspiciousNameCombination
    x = y;
    y = tmp - dimension.height;

    const { children } = layoutNode;
    if (!children)
    {
        return;
    }

    // 90 degree display rotation
    const offX = dimension.width - offsetX;
    const halfHeight = Math.floor(dimension.height / 2);
    const offY = halfHeight - offsetY;


    const x2 = minXOfChildren(layoutNode) - hGap;
    let path = "M" + (x + offX) + "," + (y + offY) + "L" + (x2 - offsetX) + "," + (y + offY);

    let minY = y + halfHeight
    let maxY = y + halfHeight;

    for (let i = 0; i < children.length; i++)
    {
        const kid = children[i];

        let { right: kidX, y: kidY } = kid;
        // rotate 90 degree ccw and mirror on the x axis
        const { height }  = tree.getDimension(ConditionEditorState.getNodeId(kid.data));
        let tmp = kidX;
        // noinspection JSSuspiciousNameCombination
        kidX = kidY;
        kidY = tmp - height;


        kidY += height/2;

        if (kidY < minY)
        {
            minY = kidY
        }
        if (kidY > maxY)
        {
            maxY = kidY
        }

        path += "M" + (x2 - offsetX ) + "," + (kidY - offsetY) + "L" + (kidX - offsetX) + "," + (kidY - offsetY);
                

    }

    path += "M" + (x2 - offsetX) + "," + (minY - offsetY) + "L" + (x2 - offsetX) + "," + (maxY - offsetY);

    return (
        <path
            key={ "deco" + ConditionEditorState.getNodeId(layoutNode.data) }
            d={ /infinite|nan/i.test(path) ? "" : path }
            { ... opts.pathProps}

        />
    );
}

ConditionEditor.propTypes = {
    rootType: PropTypes.string.isRequired,
    pointer : PropTypes.instanceOf(ConditionPointer).isRequired,
    className : PropTypes.string,
    options : PropTypes.object,
    formContext: PropTypes.instanceOf(FormContext),

    /**
     * available fields for field selects
     */
    fields: PropTypes.arrayOf(PropTypes.object),

    /**
     * callback function called on changes to the condition
     */
    onChange: PropTypes.func,

    /**
     * the current condition
     */
    queryCondition: PropTypes.object,

    /**
     * enable the import/export link for editing the condition in json format
     */
    enableImportExport: PropTypes.bool
}

export default ConditionEditor;
