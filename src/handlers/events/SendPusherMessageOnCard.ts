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
import { OnCard } from "../../typings/types";

@EventHandler("Send a Pusher message on Card events",
    subscription("onCard"))
export class SendPusherMessageOnCard implements HandleEvent<OnCard.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnCard.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const card = e.data.Card[0];

        logger.info("Sending card '%j'", card);
        this.pusher.trigger(
            `private-${ctx.teamId}`,
            "card_stream",
            {
                id: card.id,
                teamId: ctx.teamId,
            });

        return SuccessPromise;
    }
}
