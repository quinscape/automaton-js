/**
 * Decorator to annotate DomainQL types for Scope observables. Currently not actually doing anything, for now just an
 * annotation of types.
 *
 * @param target
 * @param name
 * @param descriptor
 * @return {*}
 */
export default function type(typeName) {

    console.log("@TYPE", typeName);

    return function type(target, name, descriptor) {

        return descriptor;
    };
}
