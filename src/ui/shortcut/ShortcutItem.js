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
    workingSet
}) => {

    const formConfig = useFormConfig();
    const formContext = formConfig.formContext;
    const [errorCount, setErrorCount] = React.useState(0);
    const [changesCount, setChangesCount] = React.useState(0);

    const errors = formContext.getErrors();
    const depError = errors.map(e => `${e.rootId}:${e.path}`).join(",");

    useEffect(() => {
        const fieldContexts = formContext.fieldContexts;
        let count = 0;
        for (let i = 0; i < fieldContexts.length; i++) {
            const ctx = fieldContexts[i];
            const fieldEl = document.getElementById(ctx.fieldId);
            if (isElementInSection(fieldEl, reference)) {
                const fieldName = fieldEl.name;
                const foundError = errors.find(e => e.path === fieldName);
                if (foundError) {
                    count++;
                }
            }
        }
        setErrorCount(count);
    }, [depError]);

    useEffect(() => {
        if (workingSet != null) {
            const registrations = workingSet.registrations;
            let count = 0;
            for (const registration of registrations) {
                if (registration.status !== WorkingSetStatus.REGISTERED
                && (registration.status !== WorkingSetStatus.MODIFIED || registration.changes.size > 0)) {
                    const gridEl = document.querySelector(`form[data-form-id] table[name="${registration.typeName}"]`);
                    if (isElementInSection(gridEl, reference)) {
                        count++;
                    } else {
                        for (const [name] of registration.changes) {
                            const fieldEl = document.querySelector(`form[data-form-id] [name="${name}"]`);
                            if (isElementInSection(fieldEl, reference)) {
                                count++;
                            }
                        }
                    }
                }
            }
            setChangesCount(count);
        }
    }, [workingSet?.changes]);

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
            aria-label={ title }
            aria-invalid={ !!errorCount || null }
            onClick={(event) => {
                const el = document.getElementById(reference);
                el.scrollIntoView();
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
