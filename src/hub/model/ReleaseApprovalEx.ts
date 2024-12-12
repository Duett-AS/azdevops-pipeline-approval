import { ReleaseApproval } from "azure-devops-extension-api/Release";

export interface ReleaseApprovalEx extends ReleaseApproval {
    description: string;
    linkedWorkItems: any[];
}
