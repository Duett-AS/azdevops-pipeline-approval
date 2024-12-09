import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ApprovalStatus, EnvironmentStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds, IProjectInfo } from "azure-devops-extension-api";
import { ReleaseApprovalEx } from "../model/ReleaseApprovalEx";
import { BuildRestClient } from "azure-devops-extension-api/Build";


interface WorkItemReference {
    id: string;
    url: string;
}


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


            // Find build IDs for all artifacts in the release
            const buildIds = release.artifacts.map(a => a.definitionReference.version.id);

            releaseApproval.description = release.description;
            
            // Fetch linked work items for the specified build IDs
            releaseApproval.linkedWorkItems = [];
            for(const buildId of buildIds) {
                const workItems = await this.getLinkedWorkItems(parseInt(buildId));
                releaseApproval.linkedWorkItems.push(...workItems.map(w => w.id));
            }


            const host = SDK.getHost();
            const urls = [];

            // construct urls for work items
            for (const workItemId of releaseApproval.linkedWorkItems) {
                const constructedUrl = `https://dev.azure.com/${host.name}/${project?.name}/_workitems/edit/${workItemId}`;
                const item = `${workItemId};${constructedUrl}`;
                urls.push(item);
            }

            releaseApproval.linkedWorkItems = urls;
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

    private async getLinkedWorkItems(buildId: number): Promise<WorkItemReference[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);

        const project = await projectService.getProject();
        
        if (!project) {
            throw new Error("Project information not found in the configuration.");
        }
      
        try {
            const buildClient: BuildRestClient = getClient(BuildRestClient);
       
            // Fetch linked work items for the specified build ID
            const workItems: WorkItemReference[] = await buildClient.getBuildWorkItemsRefs(project.id, buildId);
        
            return workItems;
        } catch (error) {
            console.error("Error fetching linked work items:", error);
            return [];
        }
    }    
}