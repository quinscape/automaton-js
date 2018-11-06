export default function (WrappedComponent) {
    return WrappedComponent.displayName ||
           WrappedComponent.name ||
           "Component";
}
