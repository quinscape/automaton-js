import React, { useCallback } from "react"
import { Container, Modal, ModalBody, ModalHeader } from "reactstrap"


const ProcessDialog = props => {

    const { children, process } = props;

    const close = useCallback(
        () => props.process.endSubProcess(null),
        [ process ]
    );

    const { dialogOptions } = process;

    //console.log("ProcessDialog", dialogOptions)

    const effectiveTitle = typeof dialogOptions.title === "function" ? dialogOptions.title(process.name) : dialogOptions.title;
    return (
        <Modal
            { ... dialogOptions.props }
            isOpen={ true }
            toggle={ close }
        >
            {
                effectiveTitle && (
                    <ModalHeader
                        toggle={ close }
                    >
                        {
                            effectiveTitle
                        }
                    </ModalHeader>
                )
            }
            <ModalBody className={ dialogOptions.bodyClass }>
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
