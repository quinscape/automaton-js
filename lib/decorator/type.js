"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = type;

var _config = require("../config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LIST_PREFIX = "List:";

function defineTypeProperty(target, typeName) {
    Object.defineProperty(target, "_type", {
        enumerable: true,
        configurable: false,
        writable: true,
        value: typeName
    });
}

/**
 * Decorator factory to annotate DomainQL types for Scope observables. Currently not actually doing anything, for now just an
 * annotation of types.
 *
 * @param typeName      GraphQL input type name
 *
 * @return {*}
 */
function type(typeName) {

    //console.log("@TYPE", typeName);

    var inputSchema = _config2.default.inputSchema;


    if (inputSchema == null) {
        throw new Error("InputSchema not set in config");
    }

    var unwrapped = void 0;
    if (typeName.indexOf(LIST_PREFIX) === 0) {
        typeName = "List";
        unwrapped = typeName.substr(LIST_PREFIX.length);
    } else {
        unwrapped = typeName;
    }

    var typeDef = inputSchema.getType(unwrapped);
    if (!typeDef) {
        throw new Error("Could not find input schema definition for type '" + unwrapped + "'");
    }

    if (typeName === "List") {
        //console.log("list decorator", typeDef);

        return function type(target, name, descriptor) {
            if (!Array.isArray(target)) {
                throw new Error("@type says it's a '" + typeName + "', but the target is no array: " + target);
            }

            for (var i = 0; i < target.length; i++) {
                defineTypeProperty(target[i], unwrapped);
            }
            return descriptor;
        };
    } else if (typeDef.kind === "OBJECT") {
        //console.log("object decorator", typeDef);
        return function type(target, name, descriptor) {

            defineTypeProperty(target, typeName);
            return descriptor;
        };
    } else {
        //console.log("object decorator", typeDef);
        return function type(target, name, descriptor) {

            return descriptor;
        };
    }
}