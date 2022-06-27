import React, { useMemo, useState } from "react"
import { action, observable } from "mobx"
import i18n from "../../../i18n";

import {ButtonToolbar, Container, Modal, ModalBody, ModalHeader, Row} from "reactstrap"
import { Field, Form, Icon } from "domainql-form"
import Calendar from "react-calendar"

import set from "lodash.set"
import autoSubmitHack from "../../../util/autoSubmitHack";
import { DateTime } from "luxon";
import DateTimeCalendar from "./components/DateTimeCalendar";

/**
 * Simple FontAwesome Icon component
 */
const DateRangeModal = props =>  {

    const {
        ctx,
        formConfig,
        name,
        values,
        isOpen,
        toggle,
        scalarType,
        minDate,
        maxDate
    } = props;

    const [startDateValueFromProps, endDateValueFromProps] = values ?? [DateTime.now(), DateTime.now()];

    const [ startDateValue, setStartDateValue ] = useState(startDateValueFromProps);
    const [ endDateValue, setEndDateValue ] = useState(endDateValueFromProps);

    const choose = () => {
        formConfig.handleChange(ctx, [startDateValue, endDateValue].sort());

        autoSubmitHack(formConfig);
        toggle();
    }

    const assignStartValueToEndValue = () => {
        setEndDateValue(startDateValue);
    }

    return (
        <Modal className="date-range-modal" isOpen={ isOpen } toggle={ toggle }>
            <ModalHeader
                toggle={ toggle }
            >
                {
                    i18n("Choose Start and End Date")
                }
            </ModalHeader>
            <ModalBody>
                <Container fluid={ true }>
                    <div className="row flex-nowrap justify-content-center align-items-center">
                        <div className="column justify-content-center align-items-center">
                            <span className="calendar-header">
                                {
                                    i18n("Start Date")
                                }
                            </span>
                            <DateTimeCalendar
                                value={ startDateValue }
                                minDate={ minDate }
                                maxDate={ maxDate }
                                onChange={ setStartDateValue }
                                showTodayButton
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline-primary ml-auto"
                            onClick={ assignStartValueToEndValue }
                        >
                            <Icon className="fa-arrow-right"/>
                            {
                                i18n("Assign")
                            }
                        </button>
                        <div className="column justify-content-center align-items-center">
                            <span className="calendar-header">
                                {
                                    i18n("End Date")
                                }
                            </span>
                            <DateTimeCalendar
                                value={ endDateValue }
                                minDate={ minDate }
                                maxDate={ maxDate }
                                onChange={ setEndDateValue }
                                showTodayButton
                            />
                        </div>
                    </div>
                    <ButtonToolbar>
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
                        <button
                            type="button"
                            className="btn btn-primary ml-auto"
                            onClick={ choose }
                        >
                            <Icon className="fa-submit"/>
                            {
                                i18n("Ok")
                            }
                        </button>
                    </ButtonToolbar>
                </Container>
            </ModalBody>
        </Modal>
    );
};

DateRangeModal.propTypes = {
};

export default DateRangeModal
