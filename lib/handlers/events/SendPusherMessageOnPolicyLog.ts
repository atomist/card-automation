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
import { OnPolicyLog } from "../../typings/types";

@EventHandler("Send a Pusher message on PolicyLog events", GraphQL.subscription("OnPolicyLog"))
export class SendPusherMessageOnPolicyLog implements HandleEvent<OnPolicyLog.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public async handle(e: EventFired<OnPolicyLog.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const policy = e.data.PolicyLog[0];
        if (!!policy) {
            logger.info("Sending policy log '%j'", policy);
            this.pusher.trigger(
                `private-${ctx.workspaceId}`,
                "policy_log_stream",
                {
                    id: policy.id,
                    type: policy.type,
                    name: policy.name,
                });
        }

        return Success;
    }
}
