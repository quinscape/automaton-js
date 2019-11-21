import React, { useCallback } from "react"

import i18n from "./i18n"
import config from "./config"
import { Container, Modal, ModalBody, ModalHeader } from "reactstrap"


const ProcessDialog = props => {

    const { children, process } = props;

    const close = useCallback(
        () => props.process.endSubProcess(null),
        [ process ]
    );

    return (
        <Modal
            { ... config.processDialog.props }
            isOpen={ true }
            toggle={ close }
        >
            <ModalHeader
                toggle={ close }
            >
                {
                    i18n("Sub-Process {0}", process.name)
                }
            </ModalHeader>
            <ModalBody className={ config.processDialog.bodyClass }>
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
