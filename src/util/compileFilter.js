import { and, or, not, condition, operation, field, component, value, values, Type, isCondition, isConditionObject, getConditionArgCount, isLogicalCondition, isComposedComponentExpression, findComponentNode, toJSON, FIELD_CONDITIONS, CONDITION_METHODS, FIELD_OPERATIONS, now, today, } from "../FilterDSL"
import { DateTime } from "luxon"
import { compileCode }   from "@nx-js/compiler-util"


function apply(global, env)
{
    const out = {}

    for (let name in env)
    {
        if (env.hasOwnProperty(name))
        {
            out[name] = global[name]
            global[name] = env[name]
        }
    }
    return out
}

function restoreEnv(global, snapshot)
{
    for (let name in snapshot)
    {
        if (snapshot.hasOwnProperty(name))
        {
            global[name] = snapshot[name]
        }
    }
}


export default function compileFilter(src)
{
    const global = (0,eval)("this");

    const env = {
        and, or, not, condition, operation, field, component, value, values, Type, isCondition, isConditionObject, getConditionArgCount, isLogicalCondition, isComposedComponentExpression, findComponentNode, toJSON, FIELD_CONDITIONS, CONDITION_METHODS, FIELD_OPERATIONS, now, today, DateTime
    }

    let snap
    try
    {
        snap = apply(global, env)
        return new Function("return toJSON(" + src + ")")();
    }
    finally
    {
        restoreEnv(global, snap)
    }
}
