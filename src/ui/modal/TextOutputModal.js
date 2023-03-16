import React from "react"
import config from "../../config";
import { Modal, ModalBody, ModalHeader } from "reactstrap"

export default function TextOutputModal(props){

    const {
        headerRenderer,
        textContentRenderer,
        isOpen,
        toggleOpen
    } = props;

    return (
        <Modal isOpen={ isOpen } toggle={ toggleOpen } size="lg" fade={ config.processDialog.props.fade } className="text-output-modal">
            <ModalHeader
                toggle={ toggleOpen }
            >
                {
                    typeof headerRenderer === "function" ? headerRenderer() : headerRenderer
                }
            </ModalHeader>
            <ModalBody>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col">
                            <textarea
                                className="text-monospace w-100"
                                rows={ 16 }
                                readOnly
                            >
                                {
                                    typeof textContentRenderer === "function" ? textContentRenderer() : textContentRenderer
                                }
                            </textarea>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}
