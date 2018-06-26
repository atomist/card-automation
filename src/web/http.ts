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
            config.get("endpoints.bruce"),
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
