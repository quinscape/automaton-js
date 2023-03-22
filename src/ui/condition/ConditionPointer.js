/**
 * Helper class for FilterDSL node graph editing. Encapsulates a root condition and a path to a current position
 */
import toPath from "lodash.topath"
import get from "lodash.get"
import set from "lodash.set"
import { Type } from "../../FilterDSL"
import decompileFilter from "../../util/decompileFilter"

const __DEV__ = true

function assertType(ptr, types)
{
    const value = ptr.getValue();

    if (!value || typeof value !== "object")
    {
        throw new Error("Invalid value")
    }

    for (let i = 0; i < types.length; i++)
    {
        const type = types[i]
        if (value.type === type)
        {
            return
        }
    }

    throw new Error("Invalid state. Parent should be one of " + JSON.stringify(types))

}
export default class ConditionPointer
{
    /**
     * Creates a new condition pointer
     * @param {Object} ctx.root         observable root object
     * @param {Array} ctx.basePath      condition root base path
     * @param {String|Array}path        new path
     */
    constructor(ctx, path)
    {
        //console.log("ConditionPointer", ctx, path)

        this.ctx = ctx
        this.path = typeof path === "string" ? toPath(path) : path

        if (__DEV__)
        {
            const { basePath } = ctx;

            for (let i = 0; i < basePath.length; i++)
            {
                if (this.path[i] !==  basePath[i])
                {
                    throw new Error("Illegal state: path " + JSON.stringify(path) + " does not start with base path" + JSON.stringify(basePath))
                }
            }
        }
    }


    /**
     * Returns the condition at the location this pointer points to.
     *
     * @return {Object} condition
     */
    getValue()
    {
        let { ctx, path } = this

        if (path.length === 0)
        {
            return ctx.root;
        }
        return get(ctx.root, path);
    }


    /**
     * Writes a new condition to the location pointed to by this pointer
     *
     * @param {Object} condition    condition
     */
    setValue(condition)
    {
        const { path } = this
        if (path.length === 0)
        {
            throw new Error("Can't replace root object");
        }
        else
        {
            set(this.ctx.root, this.path, condition);
        }
    }


    /**
     * Returns the nth operand child of the current condition or operation node
     *
     * @param {number} n    Index of the operand to return
     *
     * @return {ConditionPointer}   pointer to nth operand
     */
    getOperand(n)
    {
        if (__DEV__)
        {
            assertType(this, [Type.OPERATION, Type.CONDITION])
        }
        return new ConditionPointer(this.ctx, this.path.concat(["operands", n]))
    }


    /**
     * Returns the index of the current pointer target within its siblings.
     *
     * @return {number}
     */
    getOperandIndex()
    {
        if (__DEV__)
        {
            assertType(this.getParent(), [Type.OPERATION, Type.CONDITION])
        }

        return +this.path[ this.path.length - 1]
    }


    /**
     * Returns the parent condition or null if the current condition is actually the root of the condition hierarchy.
     *
     * The method makes sure that "Component" typed nodes are parented-to correct and in dev mode the method it also
     * validates that the parent is actually a valid condition.
     *
     * @return {ConditionPointer|null} parent condition or null
     */
    getParent()
    {
        const basePathLen = this.ctx.basePath.length
        const pathLen = this.path.length
        if (basePathLen === pathLen)
        {
            return null;
        }

        const last = this.path[pathLen - 1]

        if (last === "condition")
        {
            const ptr = new ConditionPointer(
                this.ctx,
                this.path.slice(0, -1)
            )

            if (__DEV__)
            {
                assertType(ptr, [ Type.COMPONENT ])
            }

            return ptr
        }
        else if (pathLen >= 2 && /[0-9]+/.test(last))
        {
            const ptr = new ConditionPointer(
                this.ctx,
                this.path.slice(0, -2)
            )

            if (__DEV__)
            {
                assertType(ptr, [ Type.OPERATION, Type.CONDITION ])
            }

            return ptr
        }
        else
        {
            throw new Error("Unknown parent for condition: " + this)
        }
    }


    /**
     * Creates a new pointer relative to the current one. The new pointer inherits the root
     * and the base path of this pointer.
     * @param {String|Array} path   relative path
     *
     * @return {ConditionPointer} child pointer
     */
    createChild(path)
    {
        if (path === "" || (Array.isArray(path) && path.length === 0))
        {
            return this;
        }
        
        return new ConditionPointer(
            this.ctx,
            this.path.concat(toPath(path))
        )
    }


    /**
     * Returns a string representation of the complete condition hierarchy with the target object of the pointer
     * being marked within the hierarchy.
     *
     * @return {string} pretty-printed String representation with marked pointer node
     */
    toString()
    {
        const val = this.getValue();
        const rootValue = get(this.ctx.root, this.ctx.basePath)
        return "[ConditionPointer:\n" + decompileFilter(rootValue, 1, val, true) + "\n]"
    }


    /**
     * Creates a new base pointer for the given observable object root and base path. This is the only
     * pointer that has the same base path and path.
     *
     * @param {Object}  root            observable object root
     * @param {String|Array} basePath   base path
     *
     * @return {ConditionPointer} base pointer
     */
    static createBasePointer(root, basePath)
    {
        //console.log("CREATE", root, basePath)

        const base = toPath(basePath);

        if (!root || typeof root !== "object")
        {
            throw new Error("Invalid root node");
        }

        return new ConditionPointer(
            {
                root,
                basePath: base
            },
            base
        )
    }

}
