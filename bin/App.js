"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const Routes_1 = require("./Routes");
const TeamcityService_1 = require("./teamcity/TeamcityService");
const BitriseService_1 = require("./bitrise/BitriseService");
// Creates and configures an ExpressJS web server.
class App {
    //Run configuration methods on the Express instance.
    constructor() {
        this.express = express();
        this.middleware();
        this.teamcityService = new TeamcityService_1.TeamcityService();
        this.bitriseService = new BitriseService_1.BitriseService();
        this.routes();
    }
    // Configure Express middleware.
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }
    // Configure API endpoints.
    routes() {
        /* This is just to get up and running, and to make sure what we've got is
        * working so far. This function will change when we start to add more
        * API endpoints */
        let router = express.Router();
        // placeholder route handler
        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            });
        });
        const routes = new Routes_1.Routes(router, this.teamcityService, this.bitriseService);
        this.express.use('/', router);
    }
}
exports.default = new App().express;
//# sourceMappingURL=App.js.map