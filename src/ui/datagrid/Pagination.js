import React from "react"
import cx from "classnames"
import { isObservable } from "mobx"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";


export const DEFAULT_PAGE_SIZES = [
    5,
    10,
    50,
    i18n("All Rows")
];

function offsetLink(offset)
{
    return {
        name: ctx => {
            const page = ctx.currentPage + offset;
            if (page < 0 || page >= ctx.numPages)
            {
                return "";
            }
            return String(page + 1)
        },
        fn: ctx => ctx.currentPage + offset
    };
}

const BUTTON_FIRST = "First";
const BUTTON_PREV = "Prev";
const BUTTON_NEXT = "Next";
const BUTTON_LAST = "Last";

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

    const { queryConfig : { currentPage, pageSize }, rowCount } = iQuery;

    const numPages = Math.ceil(rowCount / pageSize);

    const navigate = ev => {
        ev.preventDefault();
        return iQuery.update({
            currentPage: +ev.target.dataset.page
        });
    };

    const changePageSize = ev => {
        ev.preventDefault();
        return iQuery.update({
            currentPage: 0,
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
                {
                    i18n("Row Count {0}", rowCount)
                }
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
                                        isCurrent ? "span" : "a",
                                        {
                                            className: "page-link",
                                            href: isDisabled ? null : "#",
                                            "data-page": page,
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
                    {
                        i18n("Row Count {0}", rowCount)
                    }
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
