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
