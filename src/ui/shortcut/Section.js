import React, { useContext, useEffect, useRef, useState } from "react";
import cx from "classnames";
import { FormContext, Icon } from "domainql-form";
import {Card, CardBody, CardHeader} from "reactstrap";
import PropTypes from "prop-types";
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";
import useAutomatonEnv from "../../useAutomatonEnv";
import ShortcutContext from "./ShortcutContext";
import CollapsiblePanel from "../CollapsiblePanel";
import StickySizesContext from "../sticky/StickySizesContext";
import useEffectNoInitial from "../../util/useEffectNoInitial";
import useResizeObserver from "../../util/useResizeObserver";

/**
 * Create a form section
 * 
 * This component registers the section to the shortcut context
 * 
 */
const Section = fnObserver(({
    id,
    icon,
    heading,
    headingRenderer,
    hideHeader,
    collapsible,
    initiallyCollapsed,
    pinnable,
    initiallyPinned,
    onPinnedStatusChange,
    children
}) => {

    const stickySizes = useContext(StickySizesContext);

    const sectionRef = useRef();
    const { height: sectionHeight } = useResizeObserver(sectionRef);

    const env = useAutomatonEnv();
    const shortcutState = useContext(ShortcutContext);

    useEffect(() => {
        shortcutState.setShortcut(id, heading, icon);
        return () => {
            shortcutState.removeShortcut(id);
        }
    }, [env.process.id]);

    const [isPinned, setIsPinned] = useState(false);

    const headerContent = typeof headingRenderer == "function" ? headingRenderer(heading) : (
        typeof headingRenderer == "string" ? headingRenderer : (
            <h2>{ heading }</h2>
        )
    );

    const pinButton = pinnable ? (
        <button
            type="button"
            className={ cx("btn", "btn-outline-primary", "pin-button") }
            onClick={() => {
                setIsPinned(!isPinned);
            }}
            title={isPinned ? i18n("Unpin Panel") : i18n("Pin Panel")}
        >
            <Icon className={isPinned ? "fa-lock" : "fa-lock-open"} />
        </button>
    ) : null;

    useEffect(()=>{
        if (typeof initiallyPinned === "object") {
            Promise.resolve(initiallyPinned).then(value => {
                setIsPinned(value);
            })
        }else if (typeof initiallyPinned === "boolean") {
            setIsPinned(initiallyPinned);
        }
    }, []);

    useEffectNoInitial(() => {
        if (typeof onPinnedStatusChange === "function") {
            onPinnedStatusChange(isPinned);
        }
    }, [
        isPinned
    ]);
    
    useEffect(() => {
        if (!sectionRef.current) {
            return;
        }
        if (isPinned) {
            stickySizes.setPinnedHeight(sectionHeight);
        } else {
            stickySizes.setPinnedHeight(0);
        }
    }, [sectionRef.current, sectionHeight, isPinned]);

    return (
        <div ref={sectionRef} className={cx("section-container", isPinned && "section-sticky")} style={isPinned ? { top: stickySizes.headerHeight } : {}}>
            <div id={id} className={cx("section-jump-anchor", isPinned && "jump-to-top")} style={{ position: "absolute", pointerEvents: "none", top: -stickySizes.calculatedTopOffset }} />
            {
                collapsible ? (
                    <CollapsiblePanel header={headerContent} hideHeader={hideHeader} collapsed={initiallyCollapsed} pinButton={pinButton}>
                        {
                            children
                        }
                    </CollapsiblePanel>
                ) : (
                    <Card body>
                        {
                            headerContent ? (
                                <CardHeader className={ cx(hideHeader && "sr-only") }>
                                    {
                                        headerContent
                                    }
                                </CardHeader>
                            ) : ""
                        }
                        <CardBody>
                            {
                                children
                            }
                        </CardBody>
                        {
                            pinButton
                        }
                    </Card>
                )
            }
        </div>
    );
});

Section.propTypes = {
    /**
     * the id of the resulting html element
     */
    id: PropTypes.string.isRequired,
    /**
     * the icon used for the shortcut link
     * 
     * can either be a fontawesome key or a render function
     */
    icon: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]).isRequired,
    /**
     * the header of the section and also the tooltip of the shortcut link
     */
    heading: PropTypes.string.isRequired,
    /**
     * defines how the header of the section is rendered, default is a render as h2
     */
    headingRenderer: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),
    /**
     * if set to true, the card header will be set to be visible for screenreaders only
     */
    hideHeader: PropTypes.bool,
    /**
     * the used FormContext
     * 
     * defaults to the default FormContext
     */
    formContext: PropTypes.instanceOf(FormContext),
    /**
     * defines if this section is collapsible or not
     */
    collapsible: PropTypes.bool,
    /**
     * if the section is collapsible, defines if it is initially collapsed or not
     * 
     * has no effect if the section is not collapsible
     */
    initiallyCollapsed: PropTypes.bool,
    /**
     * defines if this section is pinnable or not
     */
    pinnable: PropTypes.bool,
    /**
     * if the section is pinnable, defines if it is initially pinned or not
     * 
     * has no effect if the section is not pinnable
     */
    initiallyPinned: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.func
    ]),
    /**
     * if the section is pinnable, get called if the panel gets pinned or unpinned
     * 
     * first parameter is a boolean stating if the new status is pinned or not
     */
    onPinnedStatusChange: PropTypes.func,
}

export default Section
