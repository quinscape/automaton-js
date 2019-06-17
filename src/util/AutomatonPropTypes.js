import { isObservableSet } from "mobx"


/**
 * Automaton implementations of custom prop types.
 *
 * @type {{isObservableSet: AutomatonPropTypes.isObservableSet}}
 */
const AutomatonPropTypes = {

    /**
     * Checks if the argument is an observable set. The PropTypes in mobx-react seem to fail for an observable set.
     *
     * @param props             current object
     * @param propName          current property name
     * @param componentName     component name
     *
     * @return {?Error}  Error if invalid
     */
    isObservableSet: (props, propName, componentName) => {
        if (!isObservableSet(props[propName])) {
            return new Error(
                "Invalid prop " + propName + " supplied to '" + componentName + "': Expected an observable ES6 Set()"
            );
        }

        return null;
    }
};

export default AutomatonPropTypes;
