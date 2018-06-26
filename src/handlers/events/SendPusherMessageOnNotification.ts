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
import { OnNotification } from "../../typings/types";

@EventHandler("Send a Pusher message on Notification events",
    subscription("onNotification"))
export class SendPusherMessageOnNotification implements HandleEvent<OnNotification.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnNotification.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const card = e.data.Notification[0];

        logger.info("Sending notification '%j'", card);
        this.pusher.trigger(
            `private-${ctx.teamId}`,
            "notification_stream",
            {
                id: card.id,
                teamId: ctx.teamId,
            });

        return SuccessPromise;
    }
}
