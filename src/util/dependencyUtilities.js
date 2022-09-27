import get from "lodash.get";
import config from "../config";

/**
 * Recursively resolve the view dependencies for a table definition
 * 
 * @param {string} type the table for which to find the dependencies
 * @returns {string[]} all found dependencies as a flattened array in detection order
 */
export function resolveTableDependencies(type) {
    const dependencyMeta = config.inputSchema.getTypeMeta(type, "dependency");
    if (!dependencyMeta) {
        return null;
    }
    const dependencyList = dependencyMeta.split(",");
    const result = dependencyList.map((dependencyType) => {
        return resolveTableDependencies(dependencyType) ?? dependencyType;
    });
    return result.flat().filter((item, pos, self) => {
        return self.indexOf(item) === pos;
    });
}

/**
 * Recursively resolve the view dependencies for a field definition
 * 
 * @param {string} type the table where the field is defined in
 * @param {string} name the name of the field in the table
 * @returns {string[]} all found dependencies as a flattened array in detection order
 */
export function resolveFieldDependencies(type, name) {
    const dependencyMeta = config.inputSchema.getFieldMeta(type, name, "dependency");
    if (!dependencyMeta) {
        return null;
    }
    const dependencyList = dependencyMeta.split(",");
    const result = dependencyList.map((dependency) => {
        const [dependencyType, dependencyName] = dependency.split(".");
        return resolveFieldDependencies(dependencyType, dependencyName) ?? dependency;
    });
    return result.flat().filter((item, pos, self) => {
        return self.indexOf(item) === pos;
    });
}

/**
 * Recursively resolve the view dependencies for a field definition and look into the workingset to find a
 * changed value for the dependencies if it exists
 * 
 * @param {WorkingSet} workingSet the workingset to look into for dependency values
 * @param {FormContext} context the formcontext of the current value holder
 * @param {string} name the name of the field in the table
 * @returns if there is a value for one depency in the workingset the workingset value, else the value in
 *          the context
 */
export function resolveFieldDependenciesValue(workingSet, context, name) {
    const dependencies = resolveFieldDependencies(context._type, name);
    if (dependencies != null && workingSet) {
        for (const dependency of dependencies) {
            const [dependencyType, dependencyName] = dependency.split(".");
            const entry = workingSet.lookup(dependencyType, context.id);
            if (entry != null) {
                if (entry.status === "NEW") {
                    return entry.domainObject[dependencyName];
                }
                if (entry.changes.has(dependencyName)) {
                    return entry.changes.get(dependencyName).value;
                }
            }
        }
    }
    return get(context, name);
}
