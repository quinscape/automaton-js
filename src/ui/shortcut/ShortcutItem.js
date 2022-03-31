import React, { useEffect } from "react"
import { useFormConfig, Icon } from "domainql-form";
import { observer as fnObserver } from "mobx-react-lite"
import cx from "classnames";
import i18n from "../../i18n";

function applyMissingSection(ctx, fieldEl, reference) {
    const sectionEl = document.getElementById(reference)?.parentElement;
    const isContained = sectionEl?.contains(fieldEl);
    if (isContained) {
        ctx.section = reference;
    }
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
            if (!ctx.section) {
                applyMissingSection(ctx, fieldEl, reference);
            }
            if (ctx.section === reference) {
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
            const fieldContexts = formContext.fieldContexts;
            let count = 0;
            for (let i = 0; i < fieldContexts.length; i++) {
                const ctx = fieldContexts[i];
                const fieldEl = document.getElementById(ctx.fieldId);
                if (!ctx.section) {
                    applyMissingSection(ctx, fieldEl, reference);
                }
                if (ctx.section === reference) {
                    const registration = workingSet.lookup(ctx.rootType, ctx.root.id);
                    if (registration?.changes.has(ctx.path[0])) {
                        count++;
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
