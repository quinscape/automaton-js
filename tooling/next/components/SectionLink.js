import React, { useContext } from "react";
import { useRouter } from "next/router";

const SectionLink = ({link}) =>
{
    const router = useRouter();

    return (
        <a
            className="section-link text-muted"
            href={ router.basePath + "/" + link }
        >
            <i className="fas fa-link"></i>
        </a>
    );
};

export default SectionLink;
