import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ReleaseApproval, DeploymentStatus, DeploymentOperationStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";
import { ReleaseApprovalEx } from "../model/ReleaseApprovalEx";

export class ReleaseService {

    async getDescription(releaseApproval: ReleaseApproval): Promise<string> {

        // console.log("-- getDescription --");
        // console.log(JSON.stringify(releaseApproval));

        //return JSON.stringify(releaseApproval);

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return "";

        const client: ReleaseRestClient = getClient(ReleaseRestClient);

        const deployments = await client.getDeployments(project.name, releaseApproval.releaseDefinition.id, undefined
            , undefined, undefined, undefined, DeploymentStatus.NotDeployed, DeploymentOperationStatus.Pending);
        const deployment = deployments.find(d => d.release.id === releaseApproval.release.id && d.releaseEnvironment.id === releaseApproval.releaseEnvironment.id);
        if (!deployment) return "";

        return deployment.release.description;
    }

    async getLinks(releaseApproval: ReleaseApproval): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        const client: ReleaseRestClient = getClient(ReleaseRestClient);

        const deployments = await client.getDeployments(project.name, releaseApproval.releaseDefinition.id, undefined
            , undefined, undefined, undefined, DeploymentStatus.NotDeployed, DeploymentOperationStatus.Pending);
        const deployment = deployments.find(d => d.release.id === releaseApproval.release.id && d.releaseEnvironment.id === releaseApproval.releaseEnvironment.id);
        if (!deployment) return;
            
        releaseApproval.releaseDefinition._links = deployment.releaseDefinition._links;
        releaseApproval.release._links = deployment.release._links;
        releaseApproval.releaseEnvironment._links = deployment.releaseEnvironment._links;
    }

    async fillLinks(approvals: ReleaseApproval[]): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;
        const client: ReleaseRestClient = getClient(ReleaseRestClient);

        let releaseDefinitionsIds = this.getReleaseDefinitionsIds(approvals);

        const promises = releaseDefinitionsIds.map(async id => await client.getDeployments(project.name, id, undefined
            , undefined, undefined, undefined, DeploymentStatus.NotDeployed, DeploymentOperationStatus.Pending));
        const deploymentsMatrix = await Promise.all(promises);
        if (deploymentsMatrix.length === 0) return;

        const deployments = deploymentsMatrix.reduce((acumulator, current) => acumulator.concat(current));
        if (!deployments) return;

        await approvals.forEach(async a => {
            const deployment = deployments.find(d => d.release.id === a.release.id && d.releaseEnvironment.id === a.releaseEnvironment.id);
            if (!deployment) return;

            const description = await this.getDescription(a);
            (a as ReleaseApprovalEx).description = description;
            
            a.releaseDefinition._links = deployment.releaseDefinition._links;
            a.release._links = deployment.release._links;
            a.releaseEnvironment._links = deployment.releaseEnvironment._links;
        });
    }

    private getReleaseDefinitionsIds(approvals: ReleaseApproval[]) {
        let releasesDefinitionIds = approvals.map(a => a.releaseDefinition.id);
        releasesDefinitionIds = releasesDefinitionIds.filter((id, index) => releasesDefinitionIds.indexOf(id) === index);
        return releasesDefinitionIds;
    }
}