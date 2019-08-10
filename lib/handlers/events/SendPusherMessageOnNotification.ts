/*
 * Copyright © 2018 Atomist, Inc.
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
    SuccessPromise,
    Value,
} from "@atomist/automation-client";
import { EventHandler } from "@atomist/automation-client/lib/decorators";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import * as Pusher from "pusher";
import { OnNotification } from "../../typings/types";

@EventHandler("Send a Pusher message on Notification events", GraphQL.subscription("OnNotification"))
export class SendPusherMessageOnNotification implements HandleEvent<OnNotification.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnNotification.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const card = e.data.Notification[0];

        if (card.recipient && card.recipient.address) {
            const address = card.recipient.address;
            logger.info("Sending notification '%j'", card);
            this.pusher.trigger(
                `private-${address}`,
                "notification_stream",
                {
                    id: card.id,
                    correlationId: card.correlationId,
                    teamId: ctx.workspaceId,
                });
        }

        return SuccessPromise;
    }
}
