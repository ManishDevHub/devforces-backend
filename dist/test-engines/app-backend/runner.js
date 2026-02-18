"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCrudTests = runCrudTests;
function runCrudTests(app) {
    return {
        create: app.create(),
        update: app.update(),
        delete: app.delete(),
        fetch: app.fetch()
    };
}
