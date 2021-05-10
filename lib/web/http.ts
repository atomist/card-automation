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
    configurationValue,
    logger,
} from "@atomist/automation-client";
import { ApolloGraphClient } from "@atomist/automation-client/lib/graph/ApolloGraphClient";
import { CorsOptions } from "cors";
import * as exp from "express";
import * as _ from "lodash";
import * as Pusher from "pusher";

const PersonByIdentityQuery = `query PersonByIdentity {
  personByIdentity {
    team {
      id
      name
    }
  }
}
`;

interface PersonByIdentity {
    personByIdentity: Array<{ team: { id: string, name: string } }>;
}

export const pusherCustomizer = (express: exp.Express) => {
    const authParser = require("express-auth-parser");
    const cors = require("cors");
    const parser = require("body-parser");
    const cookieParser = require("cookie-parser");

    express.use(authParser);

    const origin = _.get(configurationValue<Configuration>(), "cors.origin", []);

    const corsOptions: CorsOptions = {
        origin,
        credentials: true,
        allowedHeaders: ["x-requested-with", "authorization", "content-type", "credential", "X-XSRF-TOKEN"],
        exposedHeaders: "*",
    };

    express.options("/v1/auth", cors(corsOptions));
    express.post("/v1/auth", cors(corsOptions), cookieParser(), parser.urlencoded({ extended: false }), (req, res) => {
        let creds: string;
        if (!!req.cookies && !!req.cookies.access_token) {
            creds = req.cookies.access_token;
        } else {
            creds = (req as any).authorization.credentials;
        }

        const originHeader = req.get("origin");
        const socketId = req.body.socket_id;
        const channel = req.body.channel_name;
        let team = channel.slice("private-".length);
        if (team.indexOf("-") >= 0) {
            team = team.substring(0, team.indexOf("-"));
        }

        const graphClient = new ApolloGraphClient(
            configurationValue<string>("person.url"),
            {
                Authorization: `Bearer ${creds}`,
            });

        graphClient.query<PersonByIdentity, {}>({ query: PersonByIdentityQuery })
            .then(result => {
                if (result.personByIdentity && result.personByIdentity.some(p => p.team && p.team.id === team)) {
                    logger.info("Granting access to channel '%s' for origin '%s'", channel, originHeader);
                    if (originHeader.includes("dso")) {
                        res.send(configurationValue<Pusher>("pusher.dso").authenticate(socketId, channel));
                    } else if (originHeader.includes("app")) {
                        res.send(configurationValue<Pusher>("pusher.app").authenticate(socketId, channel));
                    }
                } else {
                    logger.info("Denying access to channel '%s' for jwt '%s'", channel, creds);
                    res.sendStatus(403);
                }
            })
            .catch(err => {
                logger.warn("Error granting access to channel '%s'", channel);
                logger.warn(err);
                res.sendStatus(403);
            });
    });
};
