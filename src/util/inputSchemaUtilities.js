import config from "../config";
import {unwrapAll} from "./type-utils";

/**
 * Generates a tree representation of the table structure based on the given Type
 * @param {string} rootType the root type
 * @param {object} [options] options for controlling the resolve behaviour 
 * - filterCallback: callback function to filter found tables and fields
 * - recursive: wether the fields should be resolved recursively; defaults to false
 * @param {function} [options.filterCallback] callback function to filter found tables and fields
 * @param {boolean} [options.recursive] wether the fields should be resolved recursively; defaults to false
 * @returns {Object} tree representation object
 */
export function createTreeRepresentationForInputSchema(rootType, options = {}) {
    const {
        filterCallback,
        recursive = false
    } = options;
    if (typeof rootType === "string" && rootType !== "") {
        const inputSchema = config.inputSchema;
        return recursiveCreateTreeRepresentationForObject(inputSchema, rootType, "", (filterCallbackData) => {
            if (filterCallbackData.currentType === rootType) {
                return false;
            }
            if (typeof filterCallback === "function") {
                return filterCallback(filterCallbackData);
            }
            return true;
        }, !!recursive);
    }
    return {};
}

/**
 * Generates a tree representation of the table structure based on the given Type and Path
 * @param {string} rootType the root type
 * @param {string} schemaPath the root path
 * @param {object} [options] options for controlling the resolve behaviour 
 * - filterCallback: callback function to filter found tables and fields
 * - recursive: wether the fields should be resolved recursively; defaults to false
 * @param {function} [options.filterCallback] callback function to filter found tables and fields
 * @param {boolean} [options.recursive] wether the fields should be resolved recursively; defaults to false
 * @returns {Object} tree representation object
 */
export function createTreeRepresentationForInputSchemaByPath(rootType, schemaPath, options = {}) {
    const {
        filterCallback,
        recursive = false
    } = options;
    const path = schemaPath.split(".");
    if (typeof rootType === "string" && rootType !== "" && typeof schemaPath === "string" && schemaPath !== "") {
        const inputSchema = config.inputSchema;
        const foundRootType = findTypeByPath(inputSchema, rootType, schemaPath);
        return createTreeRepresentationForInputSchema(foundRootType, {
            filterCallback: (filterCallbackData) => {
                if (filterCallbackData.currentType === rootType) {
                    return false;
                }
                if (path.includes(filterCallbackData.currentName)) {
                    return false;
                }
                if (typeof filterCallback === "function") {
                    return filterCallback(filterCallbackData);
                }
                return true;
            },
            recursive
        });
    }
    return {};
}

function recursiveCreateTreeRepresentationForObject(inputSchema, schemaPath, fieldPath, filterCallback, recursive) {
    const splitPath = schemaPath.split(".");
    const tableName = splitPath.at(-1);
    const table = findSchemaObjectByName(inputSchema, tableName);
    if (table == null) {
        return {};
    }

    const result = {};

    for (const field of table.fields) {
        const fieldName = field.name;
        const {kind: unwrappedKind, name: unwrappedName} = unwrapAll(field.type);
        const newSchemaPath = `${schemaPath}.${unwrappedName}`;
        const newFieldPath = (fieldPath === "" ? fieldName : `${fieldPath}.${fieldName}`);
        const filterCallbackData = {
            fieldPath: newFieldPath,
            schemaPath: newSchemaPath,
            currentName: fieldName,
            currentType: unwrappedName
        };
        if (typeof filterCallback === "function" && !filterCallback(filterCallbackData)) {
            continue;
        }
        if (unwrappedKind === "SCALAR") {
            // console.log(`add field "${fieldName}"`);
            result[fieldName] = true;
        } else if (unwrappedKind === "OBJECT") {
            if (!splitPath.includes(unwrappedName)) {
                if (recursive) {
                    result[fieldName] = recursiveCreateTreeRepresentationForObject(inputSchema, newSchemaPath, newFieldPath, filterCallback, recursive);
                } else {
                    result[fieldName] = {};
                }
            }
        } else {
            console.warn(`Unwrapped type "${unwrappedKind}" in input schema is not known`);
        }
    }

    return result;
}

function findTypeByPath(inputSchema, rootType, schemaPath) {
    const path = schemaPath.split(".");
    const name = path.shift();
    if (name) {
        const table = findSchemaObjectByName(inputSchema, rootType);
        const field = findFieldObjectByName(table, name);
        const {kind: unwrappedKind, name: unwrappedName} = unwrapAll(field.type);
        if (unwrappedKind === "SCALAR") {
            if (path.length != 0) {
                return "";
            }
            return unwrappedKind;
        } else if (unwrappedKind === "OBJECT") {
            return findTypeByPath(inputSchema, unwrappedName, path.join("."));
        }
        return "";
    } else {
        return rootType;
    }
}

function findSchemaObjectByName(inputSchema, name) {
    return inputSchema.schema.types.find(current => {
        return current.name === name;
    });
}

function findFieldObjectByName(table, name) {
    return table.fields.find(current => {
        return current.name === name;
    });
}
