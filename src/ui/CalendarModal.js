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

    const isTimeStamp = scalarType === "Timestamp";

    const chooseDate = (value) => {
        const dt = DateTime.fromJSDate(value);

        formConfig.handleChange(ctx, dt.toFormat (isTimeStamp ? ctx.timestampFormat : ctx.dateFormat));

        autoSubmitHack(formConfig);
        toggle();
    }

    const chooseToday = () => {
        chooseDate(new Date());
    }

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
                        value={ valueFromProps && valueFromProps.toJSDate() }
                        minDate={ minDate && minDate.toJSDate() }
                        maxDate={ maxDate && maxDate.toJSDate() }
                        onChange={ chooseDate }
                    />
                    <ButtonToolbar>
                        <button
                            type="button"
                            className="btn btn-primary mr-1"
                            onClick={ chooseToday }
                        >
                            <Icon className="fa-ok"/>
                            {
                                i18n("Today")
                            }
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-primary ml-auto"
                            onClick={ toggle }
                        >
                            <Icon className="fa-cancel"/>
                            {
                                i18n("Cancel")
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
