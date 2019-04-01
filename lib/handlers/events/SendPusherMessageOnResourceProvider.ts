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
    OnBinaryRepositoryProvider,
    OnDockerRegistryProvider,
    OnKubernetesClusterProvider,
    OnScmProvider,
} from "../../typings/types";

@EventHandler("Send a Pusher message on ScmProvider events", GraphQL.subscription("OnScmProvider"))
export class SendPusherMessageOnResourceProvider implements HandleEvent<OnScmProvider.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnScmProvider.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const provider = e.data.SCMProvider[0];
        return handleProviderEvent(this.pusher, provider, ctx);
    }
}

@EventHandler("Send a Pusher message on KubernetesClusterProvider events", GraphQL.subscription("OnKubernetesClusterProvider"))
export class SendPusherMessageOnKubernetesClusterProvider implements HandleEvent<OnKubernetesClusterProvider.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnKubernetesClusterProvider.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const provider = e.data.KubernetesClusterProvider[0];
        return handleProviderEvent(this.pusher, provider, ctx);
    }
}

@EventHandler("Send a Pusher message on DockerRegistryProvider events", GraphQL.subscription("OnDockerRegistryProvider"))
export class SendPusherMessageOnDockerRegistryProvider implements HandleEvent<OnDockerRegistryProvider.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnDockerRegistryProvider.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const provider = e.data.DockerRegistryProvider[0];
        return handleProviderEvent(this.pusher, provider, ctx);
    }
}

@EventHandler("Send a Pusher message on BinaryRepositoryProvider events", GraphQL.subscription("OnBinaryRepositoryProvider"))
export class SendPusherMessageOnBinaryRepositoryProvider implements HandleEvent<OnBinaryRepositoryProvider.Subscription> {

    @Value("pusher")
    public pusher: Pusher;

    public handle(e: EventFired<OnBinaryRepositoryProvider.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        const provider = e.data.BinaryRepositoryProvider[0];
        return handleProviderEvent(this.pusher, provider, ctx);
    }
}

async function handleProviderEvent(pusher: Pusher,
                                   provider: { id?: string, __typename?: string, state?: { name?: string } },
                                   ctx: HandlerContext): Promise<HandlerResult> {
    logger.info("Sending resource provider '%j'", provider);
    pusher.trigger(
        `private-${ctx.workspaceId}`,
        "provider_stream",
        {
            id: provider.id,
            teamId: ctx.workspaceId,
            type: provider.__typename,
            state: provider.state,
        });

    return Success;
}
