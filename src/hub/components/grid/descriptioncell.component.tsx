import * as React from "react";
import { SimpleTableCell, ITableColumn } from "azure-devops-ui/Table";
import { ReleaseApproval } from "azure-devops-extension-api/Release";

export function renderGridDescriptionCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;

    return (<GridDescriptionCell
        key={`col-approver-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn} 
        releaseApproval={approval} />);
}

export interface IGridDescriptionCellProps {
    releaseApproval: ReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class GridDescriptionCell extends React.Component<IGridDescriptionCellProps> {

    constructor(props: IGridDescriptionCellProps) {
        super(props);
    }

    render(): JSX.Element {
        const description = this.props.releaseApproval.approvedBy.displayName;
        return(
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-description-${this.props.columnIndex}-${this.props.rowIndex}`}
                className="bolt-table-cell-content-with-inline-link no-v-padding">

                <div>
                    <span>{description}</span>
                </div>

            </SimpleTableCell>

        );
    }
}