import * as React from "react";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { Button } from "azure-devops-ui/Button";
import { ReleaseApprovalEvents, EventType } from "@src-root/hub/model/ReleaseApprovalEvents";
import { ReleaseApproval } from "azure-devops-extension-api/Release";

export function renderGridActionsCell<T>(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<T>,
    tableItem: any
): JSX.Element {
    const approval: ReleaseApproval = tableItem;
    return (<GridActionsCell
        key={`col-actions-${columnIndex}-${rowIndex}`}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        releaseApproval={approval} />);
}

export interface IGridActionsCellProps<T> {
    releaseApproval: ReleaseApproval;
    rowIndex: number;
    columnIndex: number;
    tableColumn: ITableColumn<T>;
}

export default class GridActionsCell<T> extends React.Component<IGridActionsCellProps<T>> {

    constructor(props: IGridActionsCellProps<T>) {
        super(props);
    }

    render(): JSX.Element {
        return (
            <SimpleTableCell
                columnIndex={this.props.columnIndex}
                tableColumn={this.props.tableColumn}
                key={`col-actions-${this.props.columnIndex}-${this.props.rowIndex}`}>
                <ButtonGroup>
                    <Button
                        key={"btn-approve-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Approve" }}
                        primary={true}
                        iconProps={{ iconName: "CheckMark" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.ApproveSingleRelease, this.props.releaseApproval)} />
                    <Button
                        key={"btn-reject-" + this.props.releaseApproval.id}
                        tooltipProps={{ text: "Reject" }}
                        danger={true}
                        iconProps={{ iconName: "Cancel" }}
                        onClick={() => ReleaseApprovalEvents.fire(EventType.RejectSingleRelease, this.props.releaseApproval)} />
                </ButtonGroup>
            </SimpleTableCell>
        );
    }
}