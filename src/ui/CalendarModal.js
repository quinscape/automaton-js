import React, { useMemo, useState } from "react"
import { action, observable } from "mobx"
import i18n from "../i18n";

import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import { Field, Form, Icon } from "domainql-form"
import Calendar from "react-calendar"

import set from "lodash.set"
import autoSubmitHack from "../util/autoSubmitHack";
import { DateTime } from "luxon";

/**
 * Simple FontAwesome Icon component
 */
const CalendarModal = props =>  {

    const { ctx, formConfig, name, value : valueFromProps, isOpen, toggle, scalarType, minDate, maxDate } = props;
    
    const [ value, setValue ] = useState(valueFromProps);

    const isTimeStamp = scalarType === "Timestamp";

    const choose = () => {

        if (value !== null)
        {
            // // correct date to reflect local time
            // const tzCorrected = new Date(value);
            // tzCorrected.setUTCMinutes(tzCorrected.getUTCMinutes() - tzCorrected.getTimezoneOffset());
            //
            // // new date object with time-zone corrected date and new time part
            // const composite = new Date();
            // composite.setUTCFullYear(tzCorrected.getUTCFullYear(), tzCorrected.getUTCMonth(), tzCorrected.getUTCDate());
            // composite.setUTCHours(tmp.getUTCHours(), tmp.getUTCMinutes(), tmp.getUTCSeconds(),tmp.getUTCMilliseconds());
            //
            // // correct back to UTC
            // composite.setUTCMinutes(composite.getUTCMinutes() + composite.getTimezoneOffset())
            //
            // //console.log("DATE", tzCorrected, "TIME", time, "=>", composite);

            const dt = DateTime.fromJSDate(value);

            //console.log("CalendarModal.choose", dt.toISO());

            formConfig.handleChange(ctx, dt.toFormat (isTimeStamp ? ctx.timestampFormat : ctx.dateFormat));

            autoSubmitHack(formConfig);
        }

        toggle();
    };

    return (
        <Modal isOpen={ isOpen } toggle={ toggle }>
            <ModalHeader
                toggle={ toggle }
            >
                {
                    isTimeStamp ?
                        i18n("Choose Timestamp") :
                        i18n("Choose Date")
                }
            </ModalHeader>
            <ModalBody>
                <Container fluid={ true }>
                    <Calendar
                        activeStartDate={ valueFromProps && valueFromProps.toJSDate() }
                        value={ valueFromProps && valueFromProps.toJSDate() }
                        minDate={ minDate && minDate.toJSDate() }
                        maxDate={ maxDate && maxDate.toJSDate() }
                        onChange={ setValue }
                    />
                    <ButtonToolbar>
                        <button
                            type="button"
                            className="btn btn-secondary mr-1"
                            onClick={ toggle }
                        >
                            <Icon className="fa-cancel"/>
                            {
                                i18n("Cancel")
                            }
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary mr-1"
                            onClick={ choose }
                        >
                            <Icon className="fa-ok"/>
                            {
                                i18n("Choose")
                            }
                        </button>
                    </ButtonToolbar>
                </Container>
            </ModalBody>
        </Modal>
    );
};

CalendarModal.propTypes = {
};

export default CalendarModal
