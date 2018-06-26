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
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    SuccessPromise,
    Value,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import * as Pusher from "pusher";
import { OnUserNotification } from "../../typings/types";

@EventHandler("Send a Pusher message on UserNotification events",
    subscription("onUserNotification"))
export class SendPusherMessageOnUserNotification implements HandleEvent<OnUserNotification.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnUserNotification.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const card = e.data.UserNotification[0];

        logger.info("Sending user notification '%j'", card);
        this.pusher.trigger(
            `private-${ctx.teamId}-${card.login}`,
            "notification_stream",
            {
                id: card.id,
                teamId: ctx.teamId,

            });

        return SuccessPromise;
    }
}
