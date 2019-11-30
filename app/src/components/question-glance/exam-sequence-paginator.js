import React from "react";
import { log } from "../../utils";
import classNames from "classnames";

import { TablePagination } from "@trendmicro/react-paginations";
// Be sure to include styles at some point, probably during your bootstraping
import "@trendmicro/react-paginations/dist/react-paginations.css";

/**
 * Provides a pagination widget where a certain number of booklets
 * can be selected. When the booklet information for those booklets is fetched,
 * `setData` is called.
 *
 * @param {{seq: number[], setData: function}} props
 * @returnType {React.Node}
 */
export function PaginatedExamSequenceSelector(props) {
    const { seq: _seq, setData = () => {}, callback = () => {} } = props;
    const [numPerPage, setNumPerPage] = React.useState(15);
    const [page, setPage] = React.useState(1);
    const [spinner, setSpinner] = React.useState(false);

    const seq = [..._seq].sort((a, b) => a - b);
    log("Paginating", seq);

    React.useEffect(() => {
        let abort = false;
        // execute `callback` with the appropriate slice of `seq`
        // and pass the resulting data to `setData`
        async function doCallback() {
            const slice = seq.slice((page - 1) * numPerPage, page * numPerPage);
            const ret = [];
            setSpinner(true);
            try {
                // get the first one and then wait for the rest in batches
                setData([]);
                if (!abort && slice.length > 0) {
                    ret.push(await callback(slice[0]));
                    setData([...ret]);
                }
                const promiseList = slice.slice(1).map(i => callback(i));
                const resolved = await Promise.all(promiseList);
                for (const item of resolved) {
                    if (abort) {
                        return;
                    }
                    ret.push(item);
                    setData([...ret]);
                }
            } catch (e) {
                log(e);
            } finally {
                setSpinner(false);
            }
        }
        doCallback();

        return () => {
            abort = true;
        };
        // eslint-disable-next-line
    }, [page, numPerPage, "" + seq]);

    return (
        <div className={classNames(["paginator"])}>
            <div
                style={{ marginTop: 14 }}
                className={classNames([{ "icon--spinner": spinner }])}
            >
                {seq.length} distinct booklets.{" "}
            </div>
            <div>
                <TablePagination
                    type="full"
                    page={page}
                    pageLength={numPerPage}
                    totalRecords={seq.length}
                    onPageChange={({ page, pageLength }) => {
                        setNumPerPage(pageLength);
                        setPage(page);
                    }}
                    prevPageRenderer={() => <i className="fa fa-angle-left" />}
                    nextPageRenderer={() => <i className="fa fa-angle-right" />}
                />
            </div>
        </div>
    );
}
