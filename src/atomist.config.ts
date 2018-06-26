import { Configuration } from "@atomist/automation-client";
import { configureLogzio } from "@atomist/automation-client-ext-logzio";
import { configureRaven } from "@atomist/automation-client-ext-raven";
import { ingester } from "@atomist/automation-client/graph/graphQL";
import * as Pusher from "pusher";
import { pusherCustomizer } from "./web/http";

export const configuration: Configuration = {
    ingesters: [
        ingester("card"),
        ingester("notification"),
        ingester("userNotification"),
    ],
    postProcessors: [
        configureLogzio,
        configureRaven,
        async cfg => {
            const pusher = new Pusher({
                appId: cfg.pusher.appId,
                key: cfg.pusher.key,
                secret: cfg.pusher.secret,
                cluster: "us2",
                encrypted: true,
            });
            cfg.pusher = pusher;
            return cfg;
        },
    ],
    http: {
        enabled: true,
        auth: {
            basic: {
                enabled: true,
            },
            bearer: {
                enabled: true,
                adminOrg: "atomisthq",
            },
        },
        customizers: [
            pusherCustomizer,
        ],
    },
};
