

export function runSystemCheck(code : any){

    return {
        retry: code.include("retry"),
        queue: code.include(" queue"),
        webhook: code.include(" signature")
    }
}