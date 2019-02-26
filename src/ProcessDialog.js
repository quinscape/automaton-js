import React, { useCallback } from "react"

import i18n from "./i18n"
import { Container, Modal, ModalBody, ModalHeader } from "reactstrap"


const ProcessDialog = props => {

    const { children, process, className, bodyClass } = props;

    const close = useCallback(
        () => props.process.endSubProcess(null),
        [ process ]
    );

    return (
        <Modal isOpen={ true } toggle={ close } className={ className } size="lg">
            <ModalHeader
                toggle={ close }
            >
                {
                    i18n("Sub-Process {0}", process.name)
                }
            </ModalHeader>
            <ModalBody className={ bodyClass }>
                <Container fluid={ true }>
                    {
                        children
                    }
                </Container>
            </ModalBody>
        </Modal>
    )
}

export default ProcessDialog
