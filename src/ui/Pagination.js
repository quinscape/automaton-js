import React from "react"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite"
import I18nTranslation from "./I18nTranslation";


export const DEFAULT_PAGE_SIZES = [
    5,
    10,
    20,
    50,
    "All Rows"
];

const BUTTON_FIRST = <I18nTranslation value="Pagination:First" />;
const BUTTON_PREV = <I18nTranslation value="Pagination:Prev" />;
const BUTTON_NEXT = <I18nTranslation value="Pagination:Next" />;
const BUTTON_LAST = <I18nTranslation value="Pagination:Last" />;

function getJustifyContentClass(align) {
    switch (align) {
        case "right": {
            return "justify-content-end"
        }
        case "center": {
            return "justify-content-center"
        }
        default: {
            return "justify-content-start"
        }
    }
}

function getTargetPage(btn, currentPage, numPages)
{
    const { name, offset } = btn;

    if (name)
    {
        if (name === BUTTON_FIRST)
        {
            return 0;
        }
        else if (name === BUTTON_PREV)
        {
            return currentPage - 1;
        }
        else if (name === BUTTON_NEXT)
        {
            return currentPage + 1;
        }
        else if (name === BUTTON_LAST)
        {
            return numPages - 1;
        }
        else
        {
            throw new Error("Invalid pagination button name '" + name + "'");
        }
    }
    else
    {
        return currentPage + offset;
    }
}

export const DEFAULT_BUTTON_CONFIG = [
    {
        name: BUTTON_FIRST,
    },
    {
        name: BUTTON_PREV,
    },
    {
        offset: -3
    },
    {
        offset: -2
    },
    {
        offset: -1
    },
    {
        offset: 0
    },
    {
        offset: 1
    },
    {
        offset: 2
    },
    {
        offset: 3
    },
    {
        name: BUTTON_NEXT,
    },
    {
        name: BUTTON_LAST
    }
];


function getPageSize(value)
{
    return typeof value === "string" ? 2147483647 : value;
}


const PageSizeSelect = props =>
{
    const { pageSize, changePageSize, pageSizes} = props;

    return (
        <label className="form-group input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">
                    <I18nTranslation value="Available Page Sizes" />
                </span>
            </div>
            <select className="form-control page-size-select" value={pageSize} onChange={changePageSize}>
                {
                    pageSizes.map((value, idx) => {

                        const pageSize = getPageSize(value);

                        return typeof value === "string" ? (
                            <I18nTranslation
                                key={idx}
                                value={value}
                                renderer={(translation) => (
                                    <option
                                        value={pageSize}
                                    >
                                        {
                                            translation
                                        }
                                    </option>
                                )}
                            />
                        ) : (
                            <option
                                key={idx}
                                value={pageSize}
                            >
                                {
                                    String(value)
                                }
                            </option>
                        );
                    })
                }
            </select>
        </label>
    );
};


const RowCountDisplay = props =>
{
    const { rowCount } = props;

    return (
        <div className="ml-2 form-group input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">
                    <I18nTranslation value="Row Count" />
                </span>
            </div>
            <div className="input-group-append">
                <span className="input-group-text">
                    {
                        rowCount
                    }
                </span>
            </div>
        </div>
    );
};

/**
 * Pagination component
 */
const Pagination = fnObserver(props => {

    const { iQuery, pageSizes, description, buttonConfig, align } = props;

    const justifyContentClass = getJustifyContentClass(align);

    const { queryConfig, rowCount } = iQuery;
    const { offset = 0, pageSize = 5 } = queryConfig ?? {};

    if (typeof offset !== "number")
    {
        throw new Error("Offset not a number: " + offset)
    }

    const numPages = Math.ceil(rowCount / pageSize);

    const navigate = ev => {
        ev.preventDefault();
        const offset = +ev.target.dataset.offset;
        return iQuery.update({
            offset
        });
    };

    const changePageSize = ev => {
        ev.preventDefault();
        return iQuery.update({
            offset: 0,
            pageSize: +ev.target.value
        });
    };

    if (numPages <= 1)
    {
        return (
            <div
                aria-label={description}
                className={cx("table-page-control", justifyContentClass)}
            >
                <div
                    className="form-inline page-sizes"
                >
                    <PageSizeSelect
                        pageSize={ pageSize }
                        changePageSize={ changePageSize }
                        pageSizes={ pageSizes }
                    />
                    <RowCountDisplay
                        rowCount={rowCount}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            aria-label={description}
            className={cx("table-page-control", justifyContentClass)}
        >
            <ul className="mr-2 ml-2 pagination form-group input-group">
                {
                    buttonConfig.map((btn, idx) => {

                        const { name } = btn;

                        const currentPage = (offset / pageSize)|0;

                        const page = getTargetPage(btn, currentPage, numPages);

                        // highlight current page if button not named
                        const isCurrent = page === currentPage && !name;
                        const isDisabled = page === currentPage || page < 0 || page >= numPages;

                        // we hide unnamed offset buttons when they're disabled
                        if (isDisabled && !name && !isCurrent)
                        {
                            return <span key={idx}/>
                        }

                        return (
                            <li
                                key={idx}
                                className={
                                    cx(
                                        "page-item",
                                        isCurrent && "active",
                                        isDisabled && !isCurrent && "disabled"
                                    )
                                }
                            >
                                {
                                    React.createElement(
                                        isCurrent || isDisabled ? "span" : "a",
                                        {
                                            className: "page-link",
                                            href: isDisabled ? null : "#",
                                            "data-offset": page * pageSize,
                                            onClick: navigate
                                        },
                                        name || String(page + 1)
                                    )
                                }
                            </li>
                        );
                    })
                }
            </ul>
            <div className="mr-2 ml-2 form-inline page-sizes">
                <PageSizeSelect
                    pageSize={ pageSize }
                    changePageSize={ changePageSize }
                    pageSizes={ pageSizes }
                />
                <RowCountDisplay
                    rowCount={rowCount}
                />
            </div>
        </div>
    )
});


Pagination.defaultProps = {
    pageSizes: DEFAULT_PAGE_SIZES,
    buttonConfig: DEFAULT_BUTTON_CONFIG
};

export default Pagination
