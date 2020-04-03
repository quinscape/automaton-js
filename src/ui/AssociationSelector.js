import React, { useState } from "react"
import PropTypes from "prop-types"
import { ButtonToolbar, ListGroup, ListGroupItem } from "reactstrap"
import { FieldMode, FormGroup, useFormConfig, Icon } from "domainql-form"
import { action, observable } from "mobx";
import { observer as fnObserver } from "mobx-react-lite";
import toPath from "lodash.topath"
import get from "lodash.get"
import set from "lodash.set"
import uuid from "uuid"
import i18n from "../i18n";
import GraphQLQuery from "../GraphQLQuery";
import { getFirstValue } from "../model/InteractiveQuery";
import { getGenericType, INTERACTIVE_QUERY } from "../domain";

import AssociationSelectorModal from "./AssociationSelectorModal";
import autoSubmitHack from "../util/autoSubmitHack";
import { field, values } from "../FilterDSL";
import { lookupType } from "../util/type-utils";


function toggleOpen(modalState)
{
    return {
        ... modalState,
        isOpen: !modalState.isOpen
    };
}

const removeLink = action(
    "Remove Link",
    (root, selected, link, name, value) => {

        const id = get(link,value);
        selected.delete(id);
        const links = get(root, name);
        const newLinks = links.filter(l => l !== link);
        set(root, name, newLinks);

        //console.log("AFTER: {}", toJS(root))
    }
);

const INPUT = "Input";

const MODAL_STATE_CLOSED = {
    iQuery: null,
    columns: null,
    selectedBefore: null,
    valuePath: null,
    idPath: null,
    isOpen: false
};


let associationSelectorCount = 0;


const updateLinksAction = action("update links", (root, name, newLinks) =>
{
    set(root, name, newLinks);
});

function updateLinks(root, name, modalState, selected, generateId)
{

    const { iQuery, valuePath } = modalState;
    const idPath = valuePath.slice(1);

    const newLinkIds = new Set(selected);
    const objectLookup = new Map();

    // remove all existing linked ids
    const links = get(root, name);
    for (let i = 0; i < links.length; i++)
    {
        const link = links[i];

        const obj = get(link, valuePath[0]);

        newLinkIds.delete(obj.id);
        objectLookup.set(obj.id, obj)
    }

    const linkIdsToFetch = new Set(newLinkIds);

    // remove all selected ids from the current page and add them to our object lookup
    for (let i = 0; i < iQuery.rows.length; i++)
    {
        const row = iQuery.rows[i];
        const id = get(row, idPath);
        if (selected.has(id))
        {
            linkIdsToFetch.delete(id);
            objectLookup.set(id, row)
        }
    }

    let promise;

    const idField = idPath.join(".");
    const type = lookupType(iQuery.type, idField);
    if (type.kind !== "SCALAR")
    {
        throw new Error("Id field is not a scalar: " + iQuery.type + "." + idField)
    }

    // if there's still ids to fetch
    if (linkIdsToFetch.size > 0)
    {

        // we query the rest
        promise = iQuery._query.execute({
            config: {
                condition: field(idField)
                    .in(
                        values(type.name, ... linkIdsToFetch)
                    ),
                pageSize: 0
            }
        })
    }
    else
    {
        promise = Promise.resolve(false);
    }

    return promise.then(
        result => {
            if (result !== false)
            {
                const {rows} = getFirstValue(result);

                for (let i = 0; i < rows.length; i++)
                {
                    const row = rows[i];
                    const id = get(row, idPath);
                    objectLookup.set(id, row);
                }
            }

            const newLinks = [];

            // insert all existing links that are still selected
            for (let i = 0; i < links.length; i++)
            {
                const link = links[i];
                if (selected.has(get(link, valuePath)))
                {
                    newLinks.push(link)
                }
            }


            // create new links for new links ids
            for (let id of newLinkIds)
            {
                const newObj = {
                    id: generateId(),
                    [valuePath[0]]: objectLookup.get(id)
                };
                newLinks.push(newObj)
            }
            updateLinksAction(root, name, newLinks);
        }
    )
}


function createSelectedObservable(links, value)
{
    const valuePath = toPath(value);

    const selected = new Set();
    links.forEach(
        link => selected.add(
            get(link, valuePath)
        )
    );
    return observable(selected);
}


function setsEqual(setA, setB)
{
    if (setA.size !== setB.size)
    {
        return false;
    }
    for (let value of setA)
    {
        if (!setB.has(value))
        {
            return false;
        }
    }
    return true;
}


/**
 * Displays the currently associated entities of a many-to-many relationship as seen from one of the associated sides.
 */
const AssociationSelector = fnObserver(props => {

    const { name, value, display, mode: modeFromProps, label, query, modalTitle, fade, helpText, labelClass, formGroupClass, generateId } = props;

    const [elementId] = useState("assoc-selector-" + (++associationSelectorCount));

    const formConfig = useFormConfig();

    const [modalState, setModalState] = useState(MODAL_STATE_CLOSED);

    const links = get(formConfig.root, name);

    const [selected] = useState(() => createSelectedObservable(links, value));

    const openModal = () => {
        query.execute(
            query.defaultVars
        ).then(
            result => {
                try
                {
                    const iQuery = getFirstValue(result);
                    if (getGenericType(iQuery._type) !== INTERACTIVE_QUERY)
                    {
                        throw new Error("Result is no interactive query object");
                    }

                    const columns = iQuery.columnStates
                        .filter(
                            cs => cs.enabled && cs.name !== "id"
                        )
                        .map(
                            cs => cs.name
                        );


                    const valuePath = toPath(value);

                    const selectedBefore = new Set(selected);

                    setModalState({
                        iQuery,
                        columns,
                        isOpen: true,
                        valuePath,
                        selectedBefore,
                        idPath: valuePath.slice(1)
                    });

                }
                catch (e)
                {
                    console.error("ERROR", e);
                }
            }
        );
    };



    const toggle = () => {
        setModalState(toggleOpen);

        const { selectedBefore } = modalState;
        if (!setsEqual(selected, selectedBefore))
        {
            autoSubmitHack(formConfig);
            updateLinks(formConfig.root, name, modalState, selected, generateId)
        }

    };

    if (!Array.isArray(links))
    {
        throw new Error("AssociationSelector name prop must point to list of link values: " + JSON.stringify(links, null, 4));
    }

    const effectiveMode = modeFromProps || formConfig.options.mode;

    return (
        <React.Fragment>

            <FormGroup
                formConfig={ formConfig }
                fieldId={ elementId}
                label={ label }
                helpText={ helpText }
                labelClass={ labelClass }
                formGroupClass={formGroupClass}
                errorMessages={null}
                mode={ effectiveMode }
            >
                <ListGroup
                    id={ elementId }
                    className="assoc-selector"
                >
                    {
                        links.map((link,idx) => {

                            //console.log({link: toJS(link), display});

                            return (
                                <ListGroupItem
                                    key={idx}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    {
                                        typeof display === "function" ? display(link) : get(link, display)
                                    }
                                    <button
                                        type="Button"
                                        className="btn btn-link m-0 p-0"
                                        title={
                                            i18n("Remove Association")
                                        }
                                        onClick={
                                            () => removeLink(formConfig.root, selected, link, name, value)
                                        }
                                    >
                                        <Icon className="fa-times"/>
                                    </button>
                                </ListGroupItem>
                            );
                        })
                    }
                </ListGroup>
                <ButtonToolbar>
                    <button
                        type="Button"
                        className="btn btn-light"
                        onClick={ openModal }
                    >
                        <Icon className="fa-clipboard-check mr-1"/>
                        Select
                    </button>
                </ButtonToolbar>
            </FormGroup>
            <AssociationSelectorModal
                { ... modalState }
                selected={ selected }
                title={modalTitle}
                toggle={toggle}
                fade={fade}
            />
        </React.Fragment>
    )

});

AssociationSelector.propTypes = {
    /**
     * Path to use as display value for associations or render function for assocations ( linkObj => ReactElement ).
     */
    display: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]).isRequired,

    /**
     * Path to use as the representative value / id of the link
     */
    value: PropTypes.string,

    /**
     * iQuery GraphQL query to fetch the current list of target objects
     */
    query: PropTypes.instanceOf(GraphQLQuery).isRequired,

    /**
     * Title for the modal dialog selecting the target object
     */
    modalTitle: PropTypes.string,

    // FIELD PROP TYPES

    /**
     * Name / path for the association selector field. In contrast to most normal fields this does not point
     * to a scalar value but to list of associative entity / link table fields with embedded target objects
     */
    name: PropTypes.string,

    /**
     * Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
     */
    mode: PropTypes.oneOf(FieldMode.values()),

    /**
     * Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
     */
    helpText: PropTypes.string,

    /**
     * Label for the field. Must be defined if name is missing.
     */
    label: PropTypes.string,

    /**
     * Additional HTML classes for the label element.
     */
    labelClass: PropTypes.string,

    /**
     * Additional HTML classes for the form group element.
     */
    formGroupClass: PropTypes.string,

    /**
     * Whether to do the modal fade animation on selection (default is true)
     */
    fade: PropTypes.bool,

    /**
     * Function to return a new id value for newly created associations. Note that you can use placeholder id values.
     *
     * Default is to create a new UUID (NPM "uuid" v4).
     */
    generateId: PropTypes.func

};

AssociationSelector.defaultProps = {
    modalTitle: i18n("Select Associated Objects"),
    fade: false,
    generateId: uuid.v4
};

AssociationSelector.displayName = "AssociationSelector";

export default AssociationSelector;
