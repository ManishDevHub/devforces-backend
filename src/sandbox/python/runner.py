import importlib.util
import json
import time


def normalize(value):
    if isinstance(value, str):
        return value.strip()
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value)


with open("tests.json", "r", encoding="utf-8") as test_file:
    payload = json.load(test_file)

tests = payload.get("tests", [])
entry_function = payload.get("entryFunction", "solve")

spec = importlib.util.spec_from_file_location("user_code", "main.py")
user_code = importlib.util.module_from_spec(spec)
spec.loader.exec_module(user_code)

start = time.time()
passed = 0
failed = 0
results = []

try:
    fn = getattr(user_code, entry_function)
except Exception:
    output = {
        "status": "ERROR",
        "passed": 0,
        "failed": len(tests),
        "total": len(tests),
        "executionMs": 0,
        "results": [],
        "error": f'Function "{entry_function}" not found in main.py',
    }
    print(json.dumps(output))
    raise SystemExit(0)

for test in tests:
    try:
        result = fn(test.get("input"))
        ok = normalize(result) == normalize(test.get("expected"))
        if ok:
            passed += 1
        else:
            failed += 1

        results.append(
            {
                "input": test.get("input"),
                "expected": test.get("expected"),
                "output": result,
                "passed": ok,
            }
        )
    except Exception as error:
        failed += 1
        results.append(
            {
                "input": test.get("input"),
                "expected": test.get("expected"),
                "passed": False,
                "error": str(error),
            }
        )

output = {
    "status": "PASSED" if failed == 0 else "FAILED",
    "passed": passed,
    "failed": failed,
    "total": len(tests),
    "executionMs": int((time.time() - start) * 1000),
    "results": results,
}

print(json.dumps(output))
