/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    EventFired,
    GraphQL,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
    Value,
} from "@atomist/automation-client";
import { EventHandler } from "@atomist/automation-client/lib/decorators";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import * as Pusher from "pusher";
import {
    OnJob,
} from "../../typings/types";

@EventHandler("Send a Pusher message on AtmJob events", GraphQL.subscription("OnJob"))
export class SendPusherMessageOnJob implements HandleEvent<OnJob.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public async handle(e: EventFired<OnJob.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const job = e.data.AtmJob[0];
        logger.info("Sending job '%j'", job);
        this.pusher.trigger(
            `private-${ctx.workspaceId}`,
            "job_stream",
            {
                id: job.id,
                name: job.name,
                description: job.description,
                owner: job.owner,
                completed: job.completedCount,
                total: job.jobCount,
                state: job.state,
                createdAt: new Date(job.createdAt).getTime(),
                updatedAt: new Date(job.updatedAt).getTime(),
            });

        return Success;
    }
}
