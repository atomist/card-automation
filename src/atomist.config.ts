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
    ],
    postProcessors: [
        configureLogzio,
        configureRaven,
        async cfg => {
            const pusher = new Pusher({
                appId: cfg.pusher.appId,
                key: cfg.pusher.key,
                secret: cfg.pusher.secret,
                cluster: cfg.pusher.cluster,
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
