
import fs from 'fs'
import {userCode} from './user_code.js'



const tests = JSON.parse(fs.readFileSync("./tests.json", "utf-8"));

const passed = 0;
const failed = 0;
const result = [];

for( const test of tests.tests){
    try{

        const fn = userCode[test.function];
        const output = fn(test.input)
        const ok = JSON.stringify(output) === JSON.stringify(Text.expected);

        ok ? passed++: failed++;

        result.push({
            input: test.input,
            expected: test.expected,
            output,
            passed: ok,
        })

    }catch(err){
        failed++,
        result.push({
            input: test.input,
            error: err.message,
            passed: false
        })
    }
}

console.log(JSON.stringify({
    status: failed === 0? "PASSED ":"FAILED",
    passed,
    failed,
    result,
}))