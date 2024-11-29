import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ApprovalStatus, EnvironmentStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds, IProjectInfo } from "azure-devops-extension-api";
import { ReleaseApprovalEx } from "../model/ReleaseApprovalEx";

export class ReleaseApprovalService {

    async findAllApprovals(): Promise<ReleaseApprovalEx[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const currentUser = SDK.getUser();
        if (!project) return [];
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        const allApprovals: ReleaseApprovalEx[] = [];
        const top = 500;
        let approvals: ReleaseApprovalEx[];
        
        let continuationToken = 0;
        do {
            approvals = (await client.getApprovals(project.name, currentUser.id, undefined, undefined, undefined, top, continuationToken, undefined, true)) as ReleaseApprovalEx[];
            if (approvals.length > 0) {
                allApprovals.push(...approvals.filter(a => a.id != continuationToken));
                continuationToken = approvals[approvals.length - 1].id;
            }
        } while (approvals.length == top);

        for(const releaseApproval of allApprovals) {
            const release = await client.getRelease(project.name, releaseApproval.release.id);

            releaseApproval.description = release.description;
        };

        return allApprovals as ReleaseApprovalEx[];
    }

    async findApprovals(top: number = 50, continuationToken: number = 0): Promise<ReleaseApprovalEx[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const currentUser = SDK.getUser();
        if (!project) return [];
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        let approvals = await client.getApprovals(project.name, currentUser.id, undefined, undefined, undefined, top, continuationToken, undefined, true);
        return approvals as ReleaseApprovalEx[];
    }

    private async scheduleDeployment(approval: ReleaseApprovalEx, deferredDate: Date): Promise<void> {
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

    private async changeStatus(approval: ReleaseApprovalEx, approvalStatus: ApprovalStatus, comment: string): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        approval.status = approvalStatus;
        approval.comments = comment;
        await client.updateReleaseApproval(approval, project.name, approval.id);
    }

    async approveAll(approvals: ReleaseApprovalEx[], comment: string, deferredDate?: Date | null): Promise<void> {
        approvals.forEach(async (approval: ReleaseApprovalEx, index: number) => await this.approve(approval, comment, deferredDate));
    }

    async approve(approval: ReleaseApprovalEx, comment: string, deferredDate?: Date | null): Promise<void> {
        if (deferredDate) {
            await this.scheduleDeployment(approval, deferredDate);
        }
        await this.changeStatus(approval, ApprovalStatus.Approved, comment);
    }

    async rejectAll(approvals: ReleaseApprovalEx[], comment: string): Promise<void> {
        approvals.forEach(async (approval: ReleaseApprovalEx, index: number) => await this.reject(approval, comment));
    }

    async reject(approval: ReleaseApprovalEx, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Rejected, comment);
    }
}