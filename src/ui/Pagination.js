import React from "react"
import cx from "classnames"
import { isObservable, toJS } from "mobx"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../i18n";


export const DEFAULT_PAGE_SIZES = [
    5,
    10,
    50,
    i18n("All Rows")
];

const BUTTON_FIRST = i18n("Pagination:First");
const BUTTON_PREV = i18n("Pagination:Prev");
const BUTTON_NEXT = i18n("Pagination:Next");
const BUTTON_LAST = i18n("Pagination:Last");

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

    return <div className="form-group">
        <label>
            {
                i18n("Available Page Sizes")
            }
            <select className="ml-1 form-control" value={pageSize} onChange={changePageSize}>
                {
                    pageSizes.map((value, idx) => {

                        const pageSize = getPageSize(value);

                        return (
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
    </div>;
};

/**
 * Pagination component
 */
const Pagination = fnObserver(props => {

    const { iQuery, pageSizes, description, buttonConfig } = props;

    const { queryConfig : { offset, pageSize }, rowCount } = iQuery;

    if (typeof offset !== "number")
    {
        throw new Error("Offset not a number: " + offset)
    }

    const numPages = Math.ceil(rowCount / pageSize);

    const navigate = ev => {
        ev.preventDefault();
        const offset = +ev.target.dataset.offset;

        //console.log("Pagination.navigate", offset);

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
            <div className="form-inline">
                <PageSizeSelect
                    pageSize={ pageSize }
                    changePageSize={ changePageSize }
                    pageSizes={ pageSizes }
                />
                <span className="ml-4">
                    {
                        i18n("Row Count {0}", rowCount)
                    }
                </span>
            </div>
        );
    }

    return (
        <div
            aria-label={description}
        >
            <ul className="pagination">
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
                <li className="form-inline ml-4">
                    <PageSizeSelect
                        pageSize={ pageSize }
                        changePageSize={ changePageSize }
                        pageSizes={ pageSizes }
                    />
                    <span className="ml-4">
                        {
                            i18n("Row Count {0}", rowCount)
                        }
                    </span>
                </li>
            </ul>
        </div>
    )
});


Pagination.defaultProps = {
    pageSizes: DEFAULT_PAGE_SIZES,
    buttonConfig: DEFAULT_BUTTON_CONFIG
};

export default Pagination
