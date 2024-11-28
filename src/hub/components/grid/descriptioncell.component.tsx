import * as React from "react";
import { SimpleTableCell, ITableColumn } from "azure-devops-ui/Table";
import { ReleaseApproval } from "azure-devops-extension-api/Release";
import { ReleaseService } from "@src-root/hub/services/release.service";
import { ReleaseApprovalEx } from "@src-root/hub/model/ReleaseApprovalEx";

export function renderGridDescriptionCell (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;

    return (<GridDescriptionCell
        key={`col-description-${columnIndex}-${rowIndex}`}
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

    private _releaseService: ReleaseService = new ReleaseService();

    constructor(props: IGridDescriptionCellProps) {
        super(props);
    }

    render(): JSX.Element {
        return(
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-description-${this.props.columnIndex}-${this.props.rowIndex}`}
                className="bolt-table-cell-content-with-inline-link no-v-padding">

                <div>
                    <span>{(this.props.releaseApproval as ReleaseApprovalEx).description}</span>
                </div>

            </SimpleTableCell>
        );
    }
}