import React, { useContext } from "react";
import { useRouter } from "next/router";

const SectionLink = ({link}) =>
{
    const router = useRouter();

    return (
        <a
            className="btn btn-link section-link text-muted"
            href={ link }
        >
            <i className="fas fa-link"></i>
        </a>
    );
};

export default SectionLink;
