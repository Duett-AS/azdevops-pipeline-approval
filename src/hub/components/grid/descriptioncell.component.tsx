import * as React from "react";
import { SimpleTableCell, ITableColumn } from "azure-devops-ui/Table";
import { ReleaseApprovalEx } from "@src-root/hub/model/ReleaseApprovalEx";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export function renderGridDescriptionCell (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<{}>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApprovalEx = tableItem;

    return (<GridDescriptionCell
        key={`col-description-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn} 
        releaseApproval={approval} />);
}

export interface IGridDescriptionCellProps {
    releaseApproval: ReleaseApprovalEx;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<{}>;
}

export default class GridDescriptionCell extends React.Component<IGridDescriptionCellProps> {

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

                <Tooltip text={this.props.releaseApproval.description}>
                    <div style={{ overflow: "hidden", whiteSpace: "normal", maxHeight: "140px", width: "400px"}}>
                        {this.props.releaseApproval.description}
                    </div>
                </Tooltip>
            </SimpleTableCell>
        );
    }
}