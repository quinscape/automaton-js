import React from "react"

import i18n from "./i18n"
import { Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import { AutomatonDevTools } from "./index";

class Dialog extends React.Component {

    close = () => this.props.process.endSubProcess(null);

    // componentDidCatch(error, info) {
    //     this.props.reject({ error, info });
    // }

    render()
    {
        const { children, process, className, bodyClass } = this.props;

        return (
            <Modal isOpen={ true } toggle={ this.close } className={ className } size="lg">
                <ModalHeader
                    toggle={ this.close }
                >
                    {
                        i18n("Sub-Process {0}", process.name)
                    }
                </ModalHeader>
                <ModalBody className={ bodyClass }>
                    <Container fluid={true}>
                        {
                            children
                        }
                    </Container>
                </ModalBody>
            </Modal>
        )
    }
}

export default Dialog
