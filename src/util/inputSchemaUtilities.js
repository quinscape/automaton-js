import config from "../config";
import {unwrapAll} from "./type-utils";

/**
 * Generates a tree representation of the table structure based on the given path.
 * @param {string} schemaPath the root path
 * @param {function} [filterCallback] callback function to filter found tables and fields
 * @returns {Object} tree representation object
 */
export function createTreeRepresentationForInputSchema(schemaPath, filterCallback) {
    const inputSchema = config.inputSchema;
    return recursiveCreateTreeRepresentationForObject(inputSchema, schemaPath, "", filterCallback);
}

function recursiveCreateTreeRepresentationForObject(inputSchema, schemaPath, fieldPath, filterCallback) {
    const splitPath = schemaPath.split(".");
    const tableName = splitPath.at(-1);
    const table = findSchemaObjectByName(inputSchema, tableName);

    const result = {};

    for (const field of table.fields) {
        const fieldName = field.name;
        const {kind: unwrappedKind, name: unwrappedName} = unwrapAll(field.type);
        const newSchemaPath = `${schemaPath}.${unwrappedName}`;
        const newFieldPath = (fieldPath === "" ? fieldName : `${fieldPath}.${fieldName}`);
        if (typeof filterCallback === "function" && !filterCallback({fieldPath: newFieldPath, schemaPath: newSchemaPath})) {
            continue;
        }
        if (unwrappedKind === "SCALAR") {
            result[fieldName] = true;
        } else if (unwrappedKind === "OBJECT") {
            if (!splitPath.includes(unwrappedName)) {
                result[fieldName] = recursiveCreateTreeRepresentationForObject(inputSchema, newSchemaPath, newFieldPath, filterCallback);
            }
        } else {
            console.warn(`Unwrapped type "${unwrappedKind}" in input schema is not known`);
        }
    }

    return result;
}

function findSchemaObjectByName(inputSchema, name) {
    return inputSchema.schema.types.find(current => {
        return current.name === name;
    });
}
