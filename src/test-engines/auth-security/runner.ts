

interface TestCase{
    input: any,
    expected: any
}
export function runAuthTests( fn:(input:any) => any , tests:TestCase[]){
    let passed = 0;

    for( const t of tests){
        try{
            if( fn(t.input )=== t.expected) passed++; 

        }catch{}
    }

    return {
        passed,
        total: tests.length,
        score: tests.length > 0 ?(passed / tests.length) * 100 : 0
    };

}