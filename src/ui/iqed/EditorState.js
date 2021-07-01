import { action, computed, observable, toJS } from "mobx";
import { parse } from "graphql/language/parser";
import { getGraphQLMethodType } from "../../Process";
import {
    findNamed,
    getFields,
    getIQueryPayloadType,
    lookupType,
    unwrapAll,
    unwrapNonNull
} from "../../util/type-utils";
import get from "lodash.get";
import config from "../../config";
import { condition, isLogicalCondition, Type } from "../../FilterDSL";
import set from "lodash.set";
import { getArgumentCount, join } from "./InteractiveQueryEditor";
import InteractiveQueryDefinition from "../../model/InteractiveQueryDefinition";
import { INTERACTIVE_QUERY } from "../../domain";
import uuid from "uuid";
import { LayoutNode } from "../../util/TreeLayout";
import LayoutNodeType from "./LayoutNodeType";


function indent(n)
{
    let s = "";
    for (let i = 0; i < n; i++)
    {
        s += "    ";
    }
    return s;
}


function closeBraces(length, prevLen)
{
    let s = "";
    let curr = prevLen;
    while (length < curr)
    {
        curr--;
        s += indent(curr) + "}\n";
    }
    return s;
}


export function renderRows(fieldSet)
{
    const fields = [...fieldSet];
    fields.sort();
    let prevLen = 1;

    let s = "";

    for (let i = 0; i < fields.length; i++)
    {
        const path = fields[i].split(/\./g);

        const {length} = path;

        if (i > 0)
        {
            s += length > prevLen ? " {\n" : "\n";

            s += closeBraces(length, prevLen);
        }
        const last = length - 1;
        s += indent(last);
        s += path[last];

        prevLen = length;
    }
    s += "\n" + closeBraces(0, prevLen - 1);

    return s;
}


function concludeValueTypes(root, condition)
{
    const {type} = condition;

    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const {operands} = condition;

        let scalarType = null;
        let haveUnknownValues = false;
        for (let i = 0; i < operands.length; i++)
        {
            const operand = operands[i];
            if (operand)
            {
                if ((operand.type === Type.VALUE || operand.type === Type.VALUES) && !operand.scalarType)
                {
                    haveUnknownValues = true;
                }
                const scalarTypeFromOperand = concludeValueTypes(root, operand);
                if (scalarTypeFromOperand && !scalarType)
                {
                    scalarType = unwrapNonNull(scalarTypeFromOperand).name;
                }

            }
        }

        if (scalarType && haveUnknownValues)
        {
            for (let i = 0; i < operands.length; i++)
            {
                const operand = operands[i];

                if ((operand.type === Type.VALUE || operand.type === Type.VALUES) && !operand.scalarType)
                {
                    operand.scalarType = scalarType;
                }
            }
        }

        return scalarType;
    }
    else if (type === Type.COMPONENT)
    {
        if (condition.condition)
        {
            return concludeValueTypes(root, condition.condition);
        }
        else
        {
            return null;
        }
    }
    else if (type === Type.VALUE || type === Type.VALUES)
    {
        return condition.scalarType;
    }
    else if (type === Type.FIELD)
    {
        let scalarType = null;
        if (condition.name)
        {
            try
            {
                scalarType = lookupType(root, condition.name);
            } catch (e)
            {
                console.error("Error looking up scalar type of Field " + root + ":" + condition.name + ": ", e);
            }
        }

        return scalarType;
    }
}


/**
 * Recursively adds the selected fields from the parsed GraphQL document to the selected fields set.
 *
 * @param {Set} fields      selected fields set
 * @param {Object} rowSelection     selection from the parsed GraphQL document
 * @param {String} parent           path of the parent or "" for a field directly in the root type
 */
function addSelectedFields(fields, rowSelection, parent = "")
{
    const name = rowSelection.name.value;
    const newPath = parent ? parent + "." + name : name;
    fields.add(newPath);

    if (rowSelection.selectionSet)
    {
        const {selections} = rowSelection.selectionSet;

        for (let i = 0; i < selections.length; i++)
        {
            addSelectedFields(fields, selections[i], newPath);
        }
    }

}


function getParentField(field)
{
    const pos = field.lastIndexOf(".");
    return pos < 0 ? null : field.substr(0, pos);
}


function layoutOperands(layoutNode, node)
{
    const {operands} = node;

    const numOperands = operands.length;

    if (numOperands)
    {
        const middle = operands.length >> 1;

        const middleNode = getLayoutNode(layoutNode, operands[middle]);

        let current = middleNode;
        for (let i = middle - 1; i >= 0; i--)
        {
            const left = getLayoutNode(layoutNode, operands[i]);
            current.leftSibling = left;
            left.rightSibling = current;
            current = left;
        }

        current = middleNode;
        for (let i = middle + 1; i < numOperands; i++)
        {
            const right = getLayoutNode(layoutNode, operands[i]);
            current.rightSibling = right;
            right.leftSibling = current;
            current = right;
        }
    }
}

function isStructuralNode(node)
{
    return node.type === Type.CONDITION && isLogicalCondition(node) || node.name === "not";
}


function isOperationNode(node)
{
    return node.type === Type.OPERATION || node.type === Type.CONDITION && !isStructuralNode(node)
}


function appendFlat(parent, array, condition)
{
    if (isOperationNode(condition))
    {
        const { operands } = condition;
        for (let i = 0; i < operands.length; i++)
        {
            if (i > 0)
            {
                array.push(condition)
            }
            const operand = operands[i];
            appendFlat(condition, array, operand)
        }
    }
    else
    {
        array.push(
            getLayoutNode(parent, condition)
        )
    }
}


function flattenOperations(parent, condition)
{

    const { operands } = condition;

    const array = [];

    for (let i = 0; i < operands.length; i++)
    {
        const operand = operands[i];
        appendFlat(condition, array, operand)
    }


    for (let i = 0; i < operands.length; i++)
    {
        const layoutNode =  getLayoutNode(parent, op)
    }

    return null;
}


function getLayoutNode(parent, condition)
{
    if (!condition)
    {
        return null;
    }

    const {type, name} = condition;

    let layoutNode = null;

    // logical conditions (including not) are structural nodes
    if (isStructuralNode(condition))
    {
        layoutNode = new LayoutNode(LayoutNodeType.LOGICAL, condition);
        layoutNode.parent = parent;
        layoutOperands(layoutNode, condition);
    }
    else
    {
        if (isOperationNode(condition))
        {
            layoutNode = flattenOperations(parent, condition)
        }
        else if (type === Type.FIELD)
        {
            layoutNode = new LayoutNode(LayoutNodeType.FIELD, condition);
        }
        else if (type === Type.VALUE)
        {
            layoutNode = new LayoutNode(LayoutNodeType.VALUE, condition);
        }
        else if (type === Type.VALUES)
        {
            layoutNode = new LayoutNode(LayoutNodeType.VALUES, condition);
        }
        else if (type === Type.COMPONENT)
        {
            return getLayoutNode(parent, condition.component);
        }
        else
        {
            throw new Error("Unhandled type: " + type);
        }
    }

    if (layoutNode)
    {
        layoutNode.parent = parent;
    }

    return layoutNode;
}


function collectFields(array, type, searchTerm, maxDepth, path)
{

    const { types } = config.inputSchema.schema;

    const typeDef = findNamed(types, type);
    if (!typeDef)
    {
        throw new Error("Error finding fields for searchTerm '" + searchTerm + "': Unknown type '" + type + "'");
    }
    
    const fields = getFields(typeDef);
    for (let i = 0; i < fields.length; i++)
    {
        const field = fields[i];

        const { name, description } = field;

        const fieldPath = join(path, name);
        if (name.toLocaleLowerCase().indexOf(searchTerm) >= 0 || description.toLocaleLowerCase().indexOf(searchTerm) >= 0)
        {
            array.push({ path : fieldPath.join("."), field });
        }

        const type = unwrapAll(field.type);
        if ( fieldPath.length < maxDepth && type.kind !== "SCALAR")
        {
            collectFields(array, type.name, searchTerm, maxDepth, fieldPath)
        }
    }
}

export function findField(type, searchTerm, maxDepth = 3)
{
    searchTerm = searchTerm.toLocaleLowerCase();

    const array = [];

    collectFields(array, type, searchTerm, maxDepth, []);

    return array;

}


export class EditorState {

    @observable fieldFilter = "";

    @observable root;
    @observable name;
    @observable rootConfirmed = false;
    @observable fields = new Set();
    @observable queryConfig = {
        condition: null,
        offset: 0,
        pageSize: 10,
        sortFields: null,
        id: null
    };

    @observable json = {
        json: "",
        path: "",
        isOpen: false
    };

    @observable queryResult = null;
    @observable queryId = null;


    @action
    updateJSON(path)
    {

        this.json.path = path;

        const condition = path ? get(this.queryConfig.condition, path) : this.queryConfig.condition;

        if (condition)
        {
            this.json.json = JSON.stringify(
                condition,
                null,
                4
            );
        }
        else
        {
            this.json.json = "";
        }
    }


    @action
    importFrom(definition)
    {
        if (definition)
        {
            this.initFromQuery(definition)
        }
    }


    initFromQuery(definition)
    {
        const {query, queryConfig} = definition;

        const fields = new Set();

        let iQueryType, queryMethod, name;
        if (query)
        {
            const doc = parse(query);

            if (doc.kind !== "Document")
            {
                throw new Error("Not a valid document, got: " + JSON.stringify(doc));
            }

            const {definitions} = doc;

            if (definitions.length > 0)
            {
                // XXX: We only handle single definition query documents for now
                const definition = definitions[0];

                name = definition.name.value;

                const methodSelection = definition.selectionSet.selections[0];

                queryMethod = methodSelection.name.value;
                iQueryType = getGraphQLMethodType(queryMethod).name;

                const selections = methodSelection.selectionSet.selections;

                for (let i = 0; i < selections.length; i++)
                {
                    const selection = selections[i];
                    if (selection.name.value === "rows")
                    {
                        const rowSelections = selection.selectionSet.selections;

                        for (let j = 0; j < rowSelections.length; j++)
                        {
                            const rowSelection = rowSelections[j];
                            addSelectedFields(fields, rowSelection);
                        }
                    }
                }
            }
        }

        if (queryMethod && iQueryType)
        {
            this.queryMethod = queryMethod;
            this.root = getIQueryPayloadType(iQueryType);
            this.name = name;
            this.rootConfirmed = true;
        }

        this.fields = fields;
        if (queryConfig)
        {
            this.queryConfig = queryConfig;
        }
    }


    @action
    setQueryMethod({queryMethod, payloadType}, rootConfirmed = false)
    {
        this.queryMethod = queryMethod;
        this.name = queryMethod;
        this.root = payloadType;

        if (rootConfirmed)
        {
            this.rootConfirmed = rootConfirmed;
        }
    }


    @action
    confirmRoot()
    {
        this.rootConfirmed = true;
    }


    @action
    setNodeValue(path, value)
    {
        if (path)
        {
            set(this.queryConfig.condition, path, value);
        }
        else
        {
            this.queryConfig.condition = value;
        }

    }


    toInteractiveQueryDefinition()
    {
        return new InteractiveQueryDefinition(
            this.renderQuery(),
            this.queryConfig
        )
    }


    @action
    updateNode(node, path, isInitial)
    {
        let newNode = {...node};

        let rearranged = false;

        const existing = path ? get(this.queryConfig.condition, path) : this.queryConfig.condition;

        const isOperation = node.type === Type.OPERATION;
        const isCondition = node.type === Type.CONDITION;
        if (isOperation || isCondition)
        {
            if (existing)
            {
                newNode.operands = existing.operands;
            }
            else
            {
                const count = getArgumentCount(node.name);
                const operands = new Array(count);
                for (let i = 0; i < count; i++)
                {
                    operands[i] = null;
                }
                newNode.operands = operands;

                rearranged = true;
            }
        }
        else if (node.type === Type.FIELD)
        {
            this._selectField(node.name);

            if (isInitial)
            {
                newNode = condition("equal", [
                    node,
                    null
                ])
            }
        }

        if (!path)
        {
            this.queryConfig = {
                condition: newNode,
                offset: 0,
                pageSize: 10,
                sortFields: []
            };
        }
        else
        {
            set(this.queryConfig.condition, path, newNode);
        }

        concludeValueTypes(this.root, this.queryConfig.condition);

        //console.log("AFTER", toJS(this.queryConfig.condition));

        return rearranged;
    }


    @action
    toggleFieldSelection(field)
    {
        if (this.fields.has(field))
        {
            // remove existing field and all its descendants
            const toDelete = []
            for (name of this.fields)
            {
                if (name === field || (name.indexOf(field) === 0 && name[field.length] === "."))
                {
                    toDelete.push(name);
                }
            }
            toDelete.forEach(field => this.fields.delete(field))
        }
        else
        {
            this.fields.add(field);
        }

        //console.log("TOGGLED", field, toJS(this.fields));
    }


    _selectField(field)
    {
        if (!this.fields.has(field))
        {
            this.fields.add(field);

            const parentField = getParentField(field);
            if (parentField != null)
            {
                this._selectField(parentField);
            }
        }
    }


    @action.bound
    toggleJSONDialog()
    {
        this.json.isOpen = !this.json.isOpen;
    }


    renderQuery()
    {
        const {name, queryMethod} = this;

        return (
            `query ${name}($config: QueryConfigInput!)
{
    ${queryMethod}(config: $config)
    {
        type
        columnStates{
            name
            enabled
            sortable
        }
        queryConfig{
            id
            condition
            offset
            pageSize
            sortFields
        }
        rows{
${this.graphQLFields}
        }
        rowCount
    }
}`
        )
    }


    @action
    setQueryResult(queryResult)
    {
        const {_type: type} = queryResult;

        if (!getIQueryPayloadType(type))
        {
            throw new Error("Not an iQuery container type: " + type);
        }

        this.queryResult = queryResult;
        this.queryId = uuid.v4();
    }


    @computed
    get graphQLFields()
    {
        const fields = [...this.fields];
        fields.sort();

        const array = [];

        for (let i = 0; i < fields.length; i++)
        {
            const name = fields[i];
            const path = name.split(/\./g);

            let curr = array;
            const last = path.length - 1;
            for (let i = 0; i < last; i++)
            {
                curr = findNamed(curr, path[i]).subsel;
                if (!curr)
                {
                    throw new Error("Could not find entry for path" + path.slice(0, i + 1))
                }
            }

            curr.push({
                name: path[last],
                subsel: []
            });
        }

        const renderFieldSelection = (array, level = 2) => {
            if (!array.length)
            {
                return "";
            }

            let s = "";
            for (let i = 0; i < array.length; i++)
            {
                const {name, subsel} = array[i];

                s += indent(level) + name;
                if (subsel.length)
                {
                    s += " {\n";
                    s += renderFieldSelection(subsel, level + 1);
                    s += indent(level) + "}\n";
                }
                else
                {
                    s += "\n";
                }
            }

            return s;
        }

        return renderFieldSelection(array);
    }


    @action.bound
    setFieldFilter(fieldFilter)
    {
        this.fieldFilter = fieldFilter;
    }


    /**
     * Alternate view on the current condition to be layed out by the treelayout
     */
    @computed
    get layoutNodes()
    {
        const {queryConfig} = this;

        const condition = queryConfig && queryConfig.condition

        return getLayoutNode(null, condition)
    }
}
