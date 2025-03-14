import React, { useEffect } from "react"
import { useFormConfig, Icon } from "domainql-form";
import { observer as fnObserver } from "mobx-react-lite"
import cx from "classnames";
import i18n from "../../i18n";
import { WorkingSetStatus } from "../../WorkingSet";

function isElementInSection(fieldEl, reference) {
    if (fieldEl != null) {
        if (fieldEl.dataset.section) {
            return fieldEl.dataset.section === reference;
        } else {
            const sectionEl = document.getElementById(reference)?.parentElement;
            if (sectionEl != null) {
                const isContained = sectionEl.contains(fieldEl);
                if (isContained) {
                    fieldEl.dataset.section = reference;
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Renders a form shortcut
 * 
 * This component renders a shortcut and, if needed, shows the error state of the corresponding section
 */
const ShortcutItem = fnObserver(({
    icon = "",
    reference = "",
    heading = "",
    workingSet: workingSetFromProps
}) => {

    const formConfig = useFormConfig();
    const formContext = formConfig.formContext;
    const [workingSet, setWorkingSet] = React.useState(null);
    const [errorCount, setErrorCount] = React.useState(0);
    const [changesCount, setChangesCount] = React.useState(0);

    const errors = formContext.getErrors();
    const depError = errors.map(e => `${e.rootId}:${e.path}`).join(",");

    useEffect(() => {
        let count = 0;
        for (let i = 0; i < errors.length; i++) {
            const error = errors[i];
            const {rootId, path} = error;
            const fieldEl = document.querySelector(`form[data-domain-id="${rootId}"] [name="${path}"]`);
            if (isElementInSection(fieldEl, reference)) {
                count++;
            } else {
                const cellEl = document.querySelector(`tr[data-domain-id="${rootId}"] td[data-name="${path}"]`);
                if (isElementInSection(cellEl, reference)) {
                    count++;
                }
            }
        }
        setErrorCount(count);
    }, [depError]);

    function updateChanges() {
        setTimeout(() => {
            const registrations = workingSetFromProps.registrations;
            let count = 0;
            for (const registration of registrations) {
                if (registration.status !== WorkingSetStatus.REGISTERED
                && (registration.status !== WorkingSetStatus.MODIFIED || registration.changes.size > 0)) {
                    const typeName = registration.typeName;
                    const rootId = registration.id;
                    const rowEl = document.querySelector(`table[name="${typeName}"] tr[data-domain-id="${rootId}"]`);
                    if (isElementInSection(rowEl, reference)) {
                        count++;
                    } else {
                        for (const [path] of registration.changes) {
                            const fieldEl = document.querySelector(`form[data-domain-id="${rootId}"] [name="${path}"]`);
                            if (isElementInSection(fieldEl, reference)) {
                                count++;
                            }
                        }
                    }
                }
            }
            setChangesCount(count);
        }, 0);
    }

    useEffect(() => {
        if (workingSet !== workingSetFromProps) {
            if (workingSet != null) {
                workingSet.unChange(updateChanges);
            }
            if (workingSetFromProps != null) {
                workingSetFromProps.onChange(updateChanges);
            }
            setWorkingSet(workingSetFromProps);
        }
        return () => {
            if (workingSetFromProps != null) {
                workingSetFromProps.unChange(updateChanges);
            }
        }
    }, [workingSetFromProps]);

    const hasChanges = changesCount ? ", has changes" : "";
    const title = errorCount === 0 ?
        i18n("Section:{0}, no errors" + hasChanges, heading) :
        i18n("Section:{0}, error(s) {1}" + hasChanges, heading, errorCount);
    const href = `#${reference}`;

    return (
        <a
            className={ cx("shortcut-link btn", errorCount ? "btn-danger" : "btn-outline-primary", !!changesCount && "has-changes") }
            href={ href } // a11y-friendly
            title={ title }
            aria-invalid={ !!errorCount || null }
            onClick={(event) => {
                const el = document.getElementById(reference);
                if (el.classList.contains("jump-to-top")) {
                    scrollTo(0, 0);
                } else {
                    el.scrollIntoView();
                }
                event.preventDefault();
            }}
        >
            {
                typeof icon == "function" ? icon() : (
                    <Icon
                        className={ icon }
                    ></Icon>
                )
            }
        </a>
    );
});

export default ShortcutItem
