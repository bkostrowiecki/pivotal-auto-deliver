import * as express from 'express';
import { NevercodeBuild } from './nevercode/NevercodeBuild';
import { PivotalTrackerService } from './pivotalTracker/PivotalTrackerService';
import { HookParameters } from './HookParameters';
import { TeamcityBuild } from './teamcity/TeamcityBuild';
import { TeamcityService } from './teamcity/TeamcityService';
import { BitriseBuild } from './bitrise/BitriseBuild';
import { BitriseService } from './bitrise/BitriseService';

export class Routes {
    constructor(
        router: express.Router,
        private teamcityService: TeamcityService,
        private bitriseService: BitriseService
    ) {
        router.post('/nevercode-hook', this.neverCodeHook.bind(this));
        router.post('/teamcity-hook', this.teamcityHook.bind(this));
        router.post('/bitrise-hook', this.bitriseHook.bind(this));
    }

    private async neverCodeHook(
        req: express.Request,
        res: express.Response    ) {
        const hookParameters = new HookParameters(req);

        const workflow = hookParameters.getWorkflow();

        const pivotalTrackerService = new PivotalTrackerService(hookParameters.getPivotalProjectId());

        try {
            const build = new NevercodeBuild(
                req.body,
                hookParameters.getWorkflow(),
                hookParameters.shouldDeliver()
            );

            const tasks = await build.getTasks();
            this.logFoundTasks(tasks);

            const deliveredTasks = await pivotalTrackerService.processTasks(
                build
            );
            this.logDeliveredTasks(deliveredTasks);

            return res.json({
                status: 'OK',
                deliveredTasks,
                workflow
            });
        } catch (e) {
            this.logError(e, req.body, workflow);

            res.status(500).json({
                error: JSON.stringify(e, null, 4),
                body: JSON.stringify(req.body, null, 4),
                workflow: workflow
            });
        }
    }

    private async teamcityHook(
        req: express.Request,
        res: express.Response    ) {
        const hookParameters = new HookParameters(req);
        const workflow = hookParameters.getWorkflow();

        console.log('Body: ', req.body);

        console.log('Pivotal tracker service creation...');
        const pivotalTrackerService = new PivotalTrackerService(hookParameters.getPivotalProjectId());
        console.log('Pivotal tracker service created');

        try {
            console.log('Teamcity build creation...');
            const build = new TeamcityBuild(
                req.body,
                this.teamcityService,
                hookParameters.getWorkflow(),
                hookParameters.shouldDeliver()
            );

            console.log('Teamcity build created');

            const deliveredTasks = await pivotalTrackerService.processTasks(build);
            this.logDeliveredTasks(deliveredTasks);

            return res.json({
                status: 'OK',
                deliveredTasks,
                workflow
            });
        } catch (e) {
            console.log(e);
            this.logError(e, req.body, workflow);

            res.status(500).json({
                error: JSON.stringify(e, null, 4),
                body: JSON.stringify(req.body, null, 4),
                workflow: workflow
            });
        }
    }

    private async bitriseHook(req: express.Request, res: express.Response) {
        const hookParameters = new HookParameters(req);
        const workflow = hookParameters.getWorkflow();

        console.log('Body: ', req.body);

        console.log('Pivotal tracker service creation...');
        const pivotalTrackerService = new PivotalTrackerService(hookParameters.getPivotalProjectId());
        console.log('Pivotal tracker service created');

        try {
            console.log('Bitrise build creation...');
            const build = new BitriseBuild(
                req.body,
                this.bitriseService,
                hookParameters.getWorkflow(),
                hookParameters.shouldDeliver()
            );

            if (!build.isTriggeredByBuildFinish()) {
                console.log('Build triggered by other action than finish')
                return res.json({
                    status: 'Ignored',
                    workflow
                });
            }

            console.log('Bitrise build created');

            const deliveredTasks = await pivotalTrackerService.processTasks(build);
            this.logDeliveredTasks(deliveredTasks);

            return res.json({
                status: 'OK',
                deliveredTasks,
                workflow
            });
        } catch (e) {
            console.log(e);
            this.logError(e, req.body, workflow);

            res.status(500).json({
                error: JSON.stringify(e, null, 4),
                body: JSON.stringify(req.body, null, 4),
                workflow: workflow
            });
        }
    }

    private logFoundTasks(tasks: string[]) {
        console.log('Found tasks ', tasks);
    }

    private logDeliveredTasks(deliveredTasks: {}) {
        console.log(
            'Tasks ',
            deliveredTasks,
            ' were successfully marked as delivered'
        );
    }

    private logError(
        e: ExceptionInformation,
        request: express.Request,
        workflow: string
    ) {
        console.log(
            'ERROR',
            JSON.stringify(e),
            'REQ.BODY',
            JSON.stringify(request.body),
            'WORKFLOW',
            JSON.stringify({
                workflow
            })
        );
    }
}
