import { create } from "domain";


export function runCrudTests(app: any) {

    return {

        create: app.create(),
        update: app.update(),
        delete: app.delete(),
        fetch: app.fetch()

    }
}