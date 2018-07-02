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

import { logger } from "@atomist/automation-client";
import { configurationValue } from "@atomist/automation-client/configuration";
import { ApolloGraphClient } from "@atomist/automation-client/graph/ApolloGraphClient";
import * as config from "config";
import * as exp from "express";
import * as Pusher from "pusher";

const PersonQuery = `query PersonByIdentiy {
  personByIdentity {
    id
    name
    team {
      id
      name
    }
  }
}`;

export const pusherCustomizer = (express: exp.Express) => {
    const authParser = require("express-auth-parser");
    const cors = require("cors");
    const parser = require("body-parser");

    express.use(authParser);

    express.options("/v1/auth", cors());
    express.post("/v1/auth", cors(), parser.urlencoded({ extended: false }),  (req, res) => {
        const auth = (req as any).authorization;

        const socketId = req.body.socket_id;
        const channel = req.body.channel_name;
        let team = channel.slice("private-".length);
        if (team.indexOf("-") >= 0) {
            team = team.substring(0, team.indexOf("-"));
        }

        const graphClient = new ApolloGraphClient(
            configurationValue<string>("person.url"),
            {
                Authorization: `Bearer ${auth.credentials}`,
            });

        graphClient.executeQuery<any, any>(PersonQuery, {})
            .then(result => {
                if (result.personByIdentity && result.personByIdentity.some(p => p.team && p.team.id === team)) {
                    logger.info("Granting access to channel '%s' for jwt '%s'", channel, auth.credentials);
                    res.send(configurationValue<Pusher>("pusher").authenticate(socketId, channel));
                } else {
                    logger.info("Denying access to channel '%s' for jwt '%s'", channel, auth.credentials);
                    res.sendStatus(403);
                }
            })
            .catch(err => {
                logger.warn("Error granting access to channel '%s' for jwt '%s'", channel, auth.credentials);
                logger.warn(err);
                res.sendStatus(403);
            });
    });
};
