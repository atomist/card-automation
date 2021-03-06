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
    Configuration,
    GraphQL,
} from "@atomist/automation-client";
import * as Pusher from "pusher";
import { pusherCustomizer } from "./lib/web/http";

export const configuration: Configuration = {
    ingesters: [
        GraphQL.ingester({ path: "./lib/graphql/ingester/card" }),
        GraphQL.ingester({ path: "./lib/graphql/ingester/notification" }),
    ],
    postProcessors: [
        async cfg => {
            cfg.pusher.app = new Pusher({
                appId: cfg.pusher.app.appId,
                key: cfg.pusher.app.key,
                secret: cfg.pusher.app.secret,
                cluster: cfg.pusher.app.cluster,
                useTLS: true,
            });

            cfg.pusher.dso = new Pusher({
                appId: cfg.pusher.dso.appId,
                key: cfg.pusher.dso.key,
                secret: cfg.pusher.dso.secret,
                cluster: cfg.pusher.dso.cluster,
                useTLS: true,
            });
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
