import json
import importlib.util

with open("tests.json") as f:
    tests = json.load(f)

spec = importlib.util.spec_from_file_location("user_code", "main.py")
user_code = importlib.util.module_from_spec(spec)
spec.loader.exec_module(user_code)

passed = 0
failed = 0
results = []

for test in tests["tests"]:
    try:
        fn = getattr(user_code, test["function"])
        output = fn(test["input"])
        ok = output == test["expected"]

        if ok:
            passed += 1
        else:
            failed += 1

        results.append({
            "input": test["input"],
            "expected": test["expected"],
            "output": output,
            "passed": ok
        })

    except Exception as e:
        failed += 1
        results.append({
            "input": test["input"],
            "error": str(e),
            "passed": False
        })

print(json.dumps({
    "status": "PASSED" if failed == 0 else "FAILED",
    "passed": passed,
    "failed": failed,
    "results": results
}))
