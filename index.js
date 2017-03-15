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
        this.logger = akyuu.logger.get('plugin-schedule');
        this.position = this.akyuu.PLUGIN_POS.AFTER_CONTROLLER;
        this.mode = options.mode;
        this.disabledTasks = options.disabledTasks || [];
        this.enabledTasks = options.enabledTasks || [];
    }

    _isEnabled(name) {
        const mode = this.mode;
        const disabledTasks = this.disabledTasks;
        const enabledTasks = this.enabledTasks;

        if(mode === 'blacklist') {
            return !(disabledTasks.indexOf(name) + 1);
        } else if(mode === 'whiteList') {
            return !!(enabledTasks.indexOf(name) + 1);
        } else {
            return true;
        }
    }

    plug() {
        const _this = this;
        const dir = path.join(_this.akyuu.config.server.root, 'scheduled');
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

            if (!_this._isEnabled(path.parse(file).name)) continue;

            schedule.scheduleJob(task.plan, function() {
                task.job(function(error) {
                    if(error) {
                        _this.logger.error('run schedule job error');
                        _this.logger.error(error.stack);
                    }
                });
            });
        }

        if(fileList.length === 0) {
            _this.logger.info('no schedule job');
        }
    }
}

module.exports.create = function(akyuu, options) {
    return new Schedule(akyuu, options);
};