import { action, makeObservable, observable, toJS } from "mobx"
import { isStructuralCondition, join } from "./condition-layout"

import { flextree } from "d3-flextree"
import { COMPUTED_VALUE_TYPE, COMPUTED_VALUES, Type } from "../../FilterDSL"
import { FormContext } from "domainql-form"
import config from "../../config"

const nodeIdSym = Symbol("condition node id")

const NULL_ID = "n-0";

const FilterDSlTypeNames = Object.values(Type)

let nodeCounter = 1;
function prepareConditionGraph(condition, path, pathLookup)
{
    if (!condition)
    {
        return;
    }

    const {type} = condition;

    let nodeId = condition[nodeIdSym];
    if (!nodeId)
    {
        nodeId = "n-" + nodeCounter++
        condition[nodeIdSym] = nodeId;
    }

    pathLookup.set(nodeId, path)

    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const {operands} = condition;
        for (let i = 0; i < operands.length; i++)
        {
            prepareConditionGraph(operands[i], join(path, "operands." + i), pathLookup);
        }

    }
    else if (type === Type.COMPONENT)
    {
        prepareConditionGraph(condition.component, join(path, "component"), pathLookup);
    }
}


/**
 * Encapsulates additional state for a single condition tree. Currently there is the general tree and a tree in the
 * expression dialog, which is rendered slightly differently.
 */
export class TreeState {
    /**
     * @type {TreeType}
     */
    type = null;

    /**
     * @type {ConditionEditorState}
     */
    editorState = null

    /**
     * Tree layout root.
     */
    @observable
    layoutRoot = null;      // The node itself is *not* observable

    /**
     * The current axis-aligned bounding-box for the condition tree (in rotated display coordinates)
     *
     * @type {AABB}
     */
    @observable
    aabb = null;       // The aabb itself is *not* observable

    /**
     * Increased to signal the need for relayout.
     *
     * @type {number}
     */
    @observable
    layoutCounter = 0;

    @observable.shallow
    dimensions = new Map();

    opts = null

    pointer = null


    /**
     *
     * @param {ConditionEditorState} editorState    parent editor state
     * @param {TreeType} type                       type of tree
     * @param {object} opts                         options object
     */
    constructor(editorState, type, opts)
    {
        this.editorState = editorState;
        this.type = type;
        this.opts = opts;

        makeObservable(this)

        this.pointer = editorState.pointer

        this.layout = this.createFlexTreeLayout(type, opts);

        this.updateLayoutRoot()
    }


    getDimension(id)
    {
        const {dimensions} = this;

        const rect = dimensions.get(id);

        if (!rect)
        {
            return {
                width: 50,
                height: 50
            }
        }

        return rect;
    }


    @action
    updateAABB(aabb)
    {
        this.aabb = aabb;
    }


    /**
     * Updates the internal registry of node sizes from the current DOM sizes of the correspnding elements.
     *
     * @param {HTMLElement} containerElem
     */
    @action
    updateDimensions(containerElem)
    {
        if (!containerElem)
        {
            throw new Error("No containerElem elem");
        }


        const rect = containerElem.getBoundingClientRect()

        const containerEnd = rect.x + rect.width

        const leaves = containerElem.querySelectorAll(".leaf");
        for (let i = 0; i < leaves.length; i++)
        {
            const leaf = leaves[i];
            const { x, width, height } = leaf.getBoundingClientRect();
            this.dimensions.set(leaf.id, { width, height, maxWidth: Math.floor(containerEnd - x) });
        }
        //console.log("UPDATE DIM (container = ", containerElem, ")\n   ", [...this.dimensions.entries()].map(([k, v]) => k + ": " + (v.width | 0) + "x" + (v.height | 0) + "( max=" + v.maxWidth+ ")").join("\n    "))
    }


    @action
    update()
    {
        this.updateLayoutRoot();
        this.layoutCounter++;
    }

    @action
    relayout()
    {
        this.layoutCounter++;
    }


    @action
    updateLayoutRoot()
    {
        const { pointer } = this

        const condition = pointer.getValue()

        this.layoutRoot = condition ? this.layout.hierarchy(condition) : null
    }


    createFlexTreeLayout(treeType, opts)
    {
        const {levelGap, spacing} = opts;

        return flextree({
            nodeSize: node => {

                const condition = node.data;
                const id = condition[nodeIdSym];
                const {width, height} = this.getDimension(id);

                // swap width and height to account for display rotation
                return [height, width + levelGap]
            },
            children: condition => {

                let result;
                if (condition && (treeType !== TreeType.MAIN || isStructuralCondition(condition)))
                {
                    const {type} = condition;

                    if (type === Type.CONDITION || type === Type.OPERATION)
                    {
                        const {operands} = condition;

                        result = operands;
                    }
                    else if (type === Type.COMPONENT)
                    {

                        result = [condition.component];
                    }
                }

                //console.log("Get children for", toJS(condition), "=>", result && result.map(v => toJS(v)))

                return result

            },
            spacing: spacing
        });
    }

}

/**
 * @enum {string}
 */
export const TreeType = {
    /**
     * Main tree
     *
     * @member {string}
     */
    MAIN: "MAIN",
    /**
     * Expression Tree
     * @member {string}
     */
    EXPR: "EXPR"
}

/**
 * Observable state for the <ConditionEditor/> component.
 */
export default class ConditionEditorState {

    /**
     * Visibility flag for the import/export dialog
     * @type {boolean}
     */
    @observable
    importExportOpen = false;

    /**
     * Visibility flag for the expression dialog
     * @type {boolean}
     */
    @observable
    expressionDialogOpen = false;

    /**
     * Visibility flag for the operation dialog in the the expression dialog
     * @type {boolean}
     */
    @observable
    operationDialogOpen = false;

    /**
     * The condition graph sub tree currently being edited in the expression editor
     *
     * @type {Object}
     */
    @observable
    expression = null;

    /**
     * Pointer to the operation under edit
     *
     * @type {ConditionPointer}
     */
    @observable
    operationPointer = null

    /**
     * Extra field determining if the operation dialog was opened for a "change operation" or a "wrap ..."
     * @type {boolean}
     */
    @observable
    isWrap = false;

    /**
     * Current json value for import/export
     * @type {String}
     */
    @observable
    json = "";

    /**
     * current editor options / tree options
     * @type {null}
     */
    opts = null;

    /**
     * Pointer to the root condition
     * @type {ConditionPointer}
     */
    pointer = null;
    
    /**
     * Map mapping structural node ids to the lodash-y path the nodes where encountered on during the last update
     * @type {Map}
     */
    pathLookup = null

    /**
     * The starting GraphQL type for the condition
     * @type {String}
     */
    rootType = null
    /**
     * Local form context to handle import/export errors
     */
    formContext = new FormContext(config.inputSchema);

    /**
     * Helper counter used to trigger form revalidation after the next render
     * @type {number}
     */
    @observable
    revalidateCount = 0

    /**
     * Main condition tree data
     *
     * @type {TreeState}
     */
    conditionTree = null

    /**
     * Main condition tree data
     *
     * @type {TreeState}
     */
    expressionTree = null

    /**
     * Toggle flag for the ComputedValueDialog
     * @type {boolean}
     */
    @observable
    computedValueDialogOpen = false

    @observable
    computedValuePointer = null

    /**
     * Increased to signal condition updates.
     *
     * @type {number}
     */
    @observable
    updateCounter = 0;

    /**
     * Increased to force form recreation
     *
     * @type {number}
     */
    @observable
    formCounter = 0;


    constructor(rootType, pointer, opts)
    {
        this.rootType = rootType;
        this.pointer = pointer;
        this.opts = opts;

        makeObservable(this)

        this.updatePathLookup()
        //console.log("PATH LOOKUP", pathLookup)

        this.conditionTree = new TreeState(this, TreeType.MAIN, opts)
        this.expressionTree = new TreeState(this, TreeType.EXPR, opts)
    }

    get conditionRoot()
    {
        const { pointer } = this

        return pointer.getValue()
    }


    static getNodeId(condition)
    {
        if (!condition)
        {
            return NULL_ID;
        }

        // for large structural changes, updateLayoutRoot ensures we get ids. Smaller changes might slip through, so
        // we double check here if we have an unknown node and provide an id on the fly
        let id = condition[nodeIdSym];
        if (!id)
        {
            id = condition[nodeIdSym];
        }
        return id;
    }


    @action.bound
    toggleImportExportOpen()
    {

        const newIsOpen = !this.importExportOpen;
        if (!newIsOpen)
        {
            const errors = this.formContext.getErrors();
            if (errors.length)
            {
                console.log("don't close")
                // bail
                return;
            }
            else
            {
                this.replaceCondition(observable(JSON.parse(this.json)))
                this.json = "";
            }
        }

        this.importExportOpen = newIsOpen;

        if (newIsOpen)
        {
            const { pointer } = this;
            this.json = JSON.stringify(
                pointer.getValue(),
                null,
                4
            );
        }

    }


    @action
    openExpressionDialog(condition, pointer)
    {
        this.expressionDialogOpen = true;
        this.expression = condition;

        this.expressionTree.pointer = pointer

        this.expressionTree.updateLayoutRoot()
    }


    @action
    openOperationDialog(pointer, isWrap)
    {
        //console.log("openOperationDialog", pointer.toString())

        this.operationDialogOpen = true;
        this.operationPointer = pointer;
        this.isWrap = isWrap
    }

    @action
    openComputedValueDialog(pointer)
    {
        //console.log("openComputedValueDialog", pointer.toString())

        this.computedValueDialogOpen = true;
        this.computedValuePointer = pointer
    }

    @action.bound
    closeExpressionDialog()
    {
        this.expressionDialogOpen = false;
        this.expression = null;

        this.formCounter++
        this.conditionTree.relayout()
    }

    @action.bound
    closeComputedValueDialog()
    {
        this.computedValueDialogOpen = false;
        this.formCounter++
        this.conditionTree.relayout()
    }

    @action.bound
    closeOperationDialog()
    {
        this.operationDialogOpen = false;
        this.operation = null;
        this.operationPointer = null;
    }

    /**
     * Central modification function for structural changes. Replaces parts of the condition with another condition graph.
     *
     * @param {Object}  condition               condition graph
     * @param {ConditionPointer} [pointer]      pointer to change (defaults to the root pointer)
     */
    @action
    replaceCondition(condition, pointer = this.pointer)
    {
        const currentCondition = pointer.getValue();

        if (currentCondition && (!currentCondition.type || FilterDSlTypeNames.indexOf(currentCondition.type) < 0))
        {
            console.warn("replaceCondition: Value being replaced does not look like a valid condition", JSON.stringify(condition))
        }

        if (condition !== currentCondition)
        {
            //console.log("Replacing pointer value", pointer.toString(), "with", toJSON(condition))

            pointer.setValue(condition)

            this.updatePathLookup();

            this.conditionTree.update();
            this.expressionTree.update();

            //this.updateCounter++;
            this.formCounter++;
        }
    }


    @action
    addInValue(pointer)
    {
        const node = pointer.getValue();

        if (node.type !== Type.VALUES)
        {
            throw new Error("Target is not a VALUES node")
        }
        node.values.push(null)

        this.conditionTree.update();
        this.expressionTree.update();
    }


    @action
    removeInValue(pointer, index)
    {
        const node = pointer.getValue()

        if (node.type !== Type.VALUES)
        {
            throw new Error("Target is not a VALUES node")
        }
        node.values.splice(index, 1)

        this.conditionTree.update();
        this.expressionTree.update();
    }


    @action
    updateOperands(pointer, operands, updateForm)
    {
        const node = pointer.getValue();

        if (node.type !== Type.OPERATION && node.type !== Type.CONDITION)
        {
            throw new Error("updateOperands: Expected node to be of type Operation or Condition.")
        }

        node.operands = operands;

        if (updateForm)
        {
            this.formCounter++
        }
    }


    @action
    updateJSON(json)
    {
        this.json = json;
    }


    /**
     * Converts the given Value node to a ComputedValue node
     * @param name          nane of computed value function
     * @param condition     condition node
     */
    @action
    convertToComputed(name, condition)
    {
        if (condition.type !== Type.VALUE)
        {
            throw new Error("Invalid condition: " + toJS(condition))
        }

        condition.scalarType = COMPUTED_VALUE_TYPE
        condition.value = {
            name,
            args: []
        }
        this.updateCounter++
    }

    @action
    changeComputedValueName(name, valueNode)
    {
        valueNode.name = name;
    }

    toRelativeFormPath(pointer, rel = "")
    {
        const { path : rootPath } = this.pointer
        const { path } = pointer

        const p = path.slice(rootPath.length)
        if (rel)
        {
            if (p.length)
            {
                return p.join(".") + "." + rel
            }
            else
            {
                return rel
            }
        }
        return p

    }

    updatePathLookup()
    {
        const { conditionRoot } = this;
        const pathLookup = new Map();
        prepareConditionGraph(conditionRoot, "", pathLookup)
        this.pathLookup = pathLookup;
    }
}
