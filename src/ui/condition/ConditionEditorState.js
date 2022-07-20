import { action, makeObservable, observable, toJS } from "mobx";
import toPath from "lodash.topath";
import set from "lodash.set";
import get from "lodash.get";
import { isStructuralCondition, join } from "./condition-layout";

import { flextree } from "d3-flextree"
import { Type, values as dslValues } from "../../FilterDSL";
import { FormContext } from "domainql-form";
import config from "../../config"


const nodeIdSym = Symbol("condition node id")

const NULL_ID = "n-0";

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

    containerPath = null


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

        this.containerPath = editorState.containerPath

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
        const { containerPath } = this
        const { container } = this.editorState

        const condition = get(container, containerPath)

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


function trap(obj, name)
{
    Object.defineProperty(obj, name, {
        get: function () {
            throw new Error("Getter for trapped '" + name + "' called")
        },
        set: function (value) {
            throw new Error("Setter for trapped '" + name + "' called with " + JSON.stringify(value))
        }
    })

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
     * The operation node currently being edited in the operation editor
     *
     * @type {Object}
     */
    @observable
    operation = null;

    /**
     * 
     * @type {string}
     */
    @observable
    operationPath = ""

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
     * Container observable
     * @type {Object}
     */
    container = null;

    /**
     * Condition path within the container
     * @type {String}
     */
    containerPath = null;

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
     * Increased to signal condition updates.
     *
     * @type {number}
     */
    @observable
    updateCounter = 0;


    constructor(rootType, container, containerPath, opts)
    {
        this.rootType = rootType;
        this.container = container;
        this.containerPath = containerPath;
        this.opts = opts;

        makeObservable(this)

        this.updatePathLookup()
        //console.log("PATH LOOKUP", pathLookup)

        this.conditionTree = new TreeState(this, TreeType.MAIN, opts)
        this.expressionTree = new TreeState(this, TreeType.EXPR, opts)

        trap(this, "expressionAabb")
        trap(this, "leafWidth")
        trap(this, "aabb")
        trap(this, "dimensions")
        trap(this, "layoutCounter")
        trap(this, "layoutExpressionCounter")
        trap(this, "component")   // ???
        trap(this, "layout")

    }

    get conditionRoot()
    {
        const { container, containerPath } = this

        return get(container, containerPath)
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
            const {container, containerPath} = this;
            this.json = JSON.stringify(
                get(container, containerPath),
                null,
                4
            );
        }

    }


    @action
    openExpressionDialog(condition, path)
    {
        this.expressionDialogOpen = true;
        this.expression = condition;

        const p = toPath(this.containerPath).concat(toPath(path));
        this.expressionTree.containerPath = p

        this.expressionTree.updateLayoutRoot()
    }


    @action
    openOperationDialog(operation, path, isWrap)
    {
        //console.log("openOperationDialog", toJS(operation), path)

        this.operationDialogOpen = true;
        this.operation = operation;
        this.operationPath = Array.isArray(path) ? path.join(".") : path;
        this.isWrap = isWrap
    }


    @action.bound
    closeExpressionDialog()
    {
        this.expressionDialogOpen = false;
        this.expression = null;

        this.conditionTree.relayout()
    }

    @action.bound
    closeOperationDialog()
    {
        this.operationDialogOpen = false;
        this.operation = null;
        this.operationPath = "";
    }

    /**
     * Central modification function for structural changes. Replaces parts of the condition with another condition graph.
     *
     * @param {Object}  condition       condition graph
     * @param path
     */
    @action
    replaceCondition(condition, path = "")
    {
        const {container, containerPath} = this;

        const p = toPath(containerPath).concat(toPath(path));
        set(container, p, condition);

        this.updatePathLookup();

        this.conditionTree.update();
        this.expressionTree.update();

        this.updateCounter++;
    }


    @action
    addInValue(path)
    {
        const {container, containerPath} = this;
        const p = toPath(containerPath).concat(toPath(path))
        const node = get(container, p);

        if (node.type !== Type.VALUES)
        {
            throw new Error("Target is not a VALUES node")
        }
        node.values.push(null)

        this.conditionTree.update();
        this.expressionTree.update();
    }


    @action
    removeInValue(path, index)
    {
        const {container, containerPath} = this;
        const p = toPath(containerPath).concat(toPath(path))
        const node = get(container, p);

        if (node.type !== Type.VALUES)
        {
            throw new Error("Target is not a VALUES node")
        }
        node.values.splice(index, 1)

        this.conditionTree.update();
        this.expressionTree.update();
    }


    @action
    updateOperands(path, operands, revalidate)
    {
        const rel = toPath(path);
        const {container, containerPath} = this;
        const p = toPath(containerPath).concat(rel.slice(0, -2));

        const node = get(container, p);
        node.operands = operands;

        if (revalidate)
        {
            this.revalidateCount++;
        }
    }


    @action
    updateJSON(json)
    {
        this.json = json;
    }


    updatePathLookup()
    {
        const { conditionRoot } = this;
        const pathLookup = new Map();
        prepareConditionGraph(conditionRoot, "", pathLookup)
        this.pathLookup = pathLookup;
    }
}
