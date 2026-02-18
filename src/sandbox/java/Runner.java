import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class Runner {
    private static class TestCase {
        String input;
        String expected;
    }

    private static String normalize(Object value) {
        if (value == null) {
            return "";
        }
        return value.toString().trim();
    }

    private static String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String extractStringValue(String line, String key) {
        String marker = "\"" + key + "\":\"";
        int start = line.indexOf(marker);
        if (start < 0) {
            return "";
        }
        start += marker.length();
        int end = line.indexOf("\"", start);
        if (end < 0) {
            return "";
        }
        return line.substring(start, end)
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
    }

    private static List<TestCase> readTests() throws Exception {
        String content = Files.readString(new File("tests.json").toPath(), StandardCharsets.UTF_8).trim();
        List<TestCase> tests = new ArrayList<>();

        int testsStart = content.indexOf("\"tests\"");
        if (testsStart < 0) {
            return tests;
        }

        int arrStart = content.indexOf("[", testsStart);
        int arrEnd = content.lastIndexOf("]");
        if (arrStart < 0 || arrEnd < 0 || arrEnd <= arrStart) {
            return tests;
        }

        String testsBlock = content.substring(arrStart + 1, arrEnd);
        String[] rows = testsBlock.split("\\},\\{");

        for (String row : rows) {
            String normalized = row;
            if (!normalized.startsWith("{")) normalized = "{" + normalized;
            if (!normalized.endsWith("}")) normalized = normalized + "}";

            TestCase test = new TestCase();
            test.input = extractStringValue(normalized, "input");
            test.expected = extractStringValue(normalized, "expected");
            tests.add(test);
        }

        return tests;
    }

    private static Method resolveSolveMethod(Class<?> clazz) throws Exception {
        try {
            return clazz.getMethod("solve", String.class);
        } catch (NoSuchMethodException ex) {
            return clazz.getMethod("solve", Object.class);
        }
    }

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();
        List<TestCase> tests = readTests();

        Class<?> solutionClass = Class.forName("Solution");
        Method solve = resolveSolveMethod(solutionClass);
        Object instance = null;

        if (!java.lang.reflect.Modifier.isStatic(solve.getModifiers())) {
            instance = solutionClass.getDeclaredConstructor().newInstance();
        }

        int passed = 0;
        int failed = 0;
        StringBuilder rows = new StringBuilder();
        rows.append("[");

        for (int i = 0; i < tests.size(); i++) {
            TestCase test = tests.get(i);

            String output;
            boolean ok;
            String error = null;

            try {
                Object raw = solve.invoke(instance, test.input);
                output = normalize(raw);
                ok = output.equals(normalize(test.expected));
            } catch (Exception ex) {
                output = "";
                ok = false;
                Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                error = cause.getMessage();
            }

            if (ok) {
                passed += 1;
            } else {
                failed += 1;
            }

            rows.append("{")
                    .append("\"input\":\"").append(escapeJson(test.input)).append("\",")
                    .append("\"expected\":\"").append(escapeJson(test.expected)).append("\",")
                    .append("\"output\":\"").append(escapeJson(output)).append("\",")
                    .append("\"passed\":").append(ok);

            if (error != null) {
                rows.append(",\"error\":\"").append(escapeJson(error)).append("\"");
            }

            rows.append("}");
            if (i < tests.size() - 1) {
                rows.append(",");
            }
        }

        rows.append("]");
        long executionMs = System.currentTimeMillis() - start;

        String status = failed == 0 ? "PASSED" : "FAILED";
        String result = "{"
                + "\"status\":\"" + status + "\","
                + "\"passed\":" + passed + ","
                + "\"failed\":" + failed + ","
                + "\"total\":" + tests.size() + ","
                + "\"executionMs\":" + executionMs + ","
                + "\"results\":" + rows
                + "}";

        System.out.println(result);
    }
}
