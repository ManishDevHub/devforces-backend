

interface TestCase{
    input: any ,
    status: any
}
export async function runApiTests(fn:(input: any) => any , tests: TestCase[]) {

    let passed = 0;

    for( const t of tests){
        const res = fn(t.input)
        if( res.status === t.status) passed++;
    }

    return {
        passed,
        total: tests.length,
        score: tests.length > 0 ? (passed / tests.length) * 100 : 0
    }
}