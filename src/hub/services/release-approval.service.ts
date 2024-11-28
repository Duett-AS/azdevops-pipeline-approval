import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ApprovalStatus, EnvironmentStatus, ReleaseApproval } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds, IProjectInfo } from "azure-devops-extension-api";
import { ReleaseApprovalEx } from "../model/ReleaseApprovalEx";

export class ReleaseApprovalService {

    async findAllApprovals(): Promise<ReleaseApproval[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const currentUser = SDK.getUser();
        if (!project) return [];
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        const allApprovals: ReleaseApproval[] = [];
        const top = 500;
        let approvals: ReleaseApproval[];
        
        let continuationToken = 0;
        do {
            approvals = await client.getApprovals(project.name, currentUser.id, undefined, undefined, undefined, top, continuationToken, undefined, true);
            if (approvals.length > 0) {
                allApprovals.push(...approvals.filter(a => a.id != continuationToken));
                continuationToken = approvals[approvals.length - 1].id;
            }
        } while (approvals.length == top);
        return allApprovals;
    }

    convertToReleaseApprovalEx(approval: ReleaseApproval): ReleaseApprovalEx 
    { 
        return approval as ReleaseApprovalEx;
    }

    async findApprovals(top: number = 50, continuationToken: number = 0): Promise<ReleaseApproval[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const currentUser = SDK.getUser();
        if (!project) return [];
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        let approvals = await client.getApprovals(project.name, currentUser.id, undefined, undefined, undefined, top, continuationToken, undefined, true);
        return approvals;
    }

    private async scheduleDeployment(approval: ReleaseApproval, deferredDate: Date): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        const updateMetadata = {
            scheduledDeploymentTime: deferredDate,
            comment: '',
            status: EnvironmentStatus.Undefined,
            variables: {}
        };
        await client.updateReleaseEnvironment(updateMetadata, project.name, approval.release.id, approval.releaseEnvironment.id);
    }

    private async changeStatus(approval: ReleaseApproval, approvalStatus: ApprovalStatus, comment: string): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        approval.status = approvalStatus;
        approval.comments = comment;
        await client.updateReleaseApproval(approval, project.name, approval.id);
    }

    async approveAll(approvals: ReleaseApproval[], comment: string, deferredDate?: Date | null): Promise<void> {
        approvals.forEach(async (approval: ReleaseApproval, index: number) => await this.approve(approval, comment, deferredDate));
    }

    async approve(approval: ReleaseApproval, comment: string, deferredDate?: Date | null): Promise<void> {
        if (deferredDate) {
            await this.scheduleDeployment(approval, deferredDate);
        }
        await this.changeStatus(approval, ApprovalStatus.Approved, comment);
    }

    async rejectAll(approvals: ReleaseApproval[], comment: string): Promise<void> {
        approvals.forEach(async (approval: ReleaseApproval, index: number) => await this.reject(approval, comment));
    }

    async reject(approval: ReleaseApproval, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Rejected, comment);
    }
}