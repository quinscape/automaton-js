import React, {useEffect, useState} from "react"
import Calendar from "react-calendar"
import {DateTime} from "luxon";
import {Icon} from "domainql-form";
import i18n from "../../../../i18n";
import {Container} from "reactstrap";

/**
 * DateTime based wrapper for React Calendar
 */
const DateTimeCalendar = props =>  {

    const {
        value: valueFromProps,
        minDate,
        maxDate,
        onChange,
        showTodayButton
    } = props;

    const [ value, setValue ] = useState(valueFromProps);

    useEffect(() => {
        setValue(valueFromProps)
    }, [valueFromProps])

    const onChangeInternal = (value) => {
        const dateTime = DateTime.fromJSDate(value);
        setValue(dateTime);
        if(typeof onChange === "function") {
            onChange(dateTime);
        }
    };

    const setToday = () => {
        onChangeInternal(new Date());
    }

    return (
        <Container fluid={ true }>
            <Calendar
                value={ value?.toJSDate() }
                minDate={ minDate?.toJSDate() }
                maxDate={ maxDate?.toJSDate() }
                onChange={ onChangeInternal }
            />
            {
                showTodayButton && (
                    <button
                        type="button"
                        className="btn btn-outline-primary mr-1"
                        onClick={ setToday }
                    >
                        <Icon className="fa-ok"/>
                        {
                            i18n("Today")
                        }
                    </button>
                )
            }
        </Container>
    );
};

DateTimeCalendar.propTypes = {
};

export default DateTimeCalendar
