/**
 * Created by fei on 2017/3/3.
 */
"use strict";

const debug = require('debug')('akyuu-schedule:');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

class Schedule {
    constructor(akyuu, options) {
        this.akyuu = akyuu;
        this.position = this.akyuu.PLUGIN_POS.AFTER_CONTROLLER;
    }

    plug() {
        const dir = path.join(this.akyuu.config.server.root, 'scheduled');
        let fileList = [];
        try {
            fileList = fs.readdirSync(dir);
        } catch (error) {
            debug(error);
        }

        for (const i of fileList) {
            let stat = null;
            const file = path.join(dir, i);
            try {
                stat = fs.statSync(file);
            } catch (error) {
                debug(error);
            }

            if (!stat) continue;
            if (!stat.isFile()) continue;
            if (!file.endsWith('.js')) continue;

            const task = require(file);
            if (!task.plan || !task.job) continue;

            schedule.scheduleJob(task.plan, task.job);
        }

        if(fileList.length === 0) {
            console.log('no task');
        }
    }
}

module.exports.create = function(akyuu, options) {
    return new Schedule(akyuu, options);
};