import com.fasterxml.jackson.databind.*;
import java.io.*;
import java.util.*;

public class Main {
    static ObjectMapper mapper = new ObjectMapper();

    public static boolean authenticate(Map<String, String> input) {
        return "Pass@123".equals(input.get("password"));
    }

    public static void main(String[] args) throws Exception {
        JsonNode tests = mapper.readTree(new File("tests.json")).get("tests");

        int passed = 0, failed = 0;
        List<Map<String, Object>> results = new ArrayList<>();

        for (JsonNode test : tests) {
            Map<String, String> input =
                mapper.convertValue(test.get("input"), Map.class);

            boolean expected = test.get("expected").asBoolean();
            boolean output = authenticate(input);

            boolean ok = output == expected;
            if (ok) passed++; else failed++;

            Map<String, Object> r = new HashMap<>();
            r.put("input", input);
            r.put("expected", expected);
            r.put("output", output);
            r.put("passed", ok);
            results.add(r);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", failed == 0 ? "PASSED" : "FAILED");
        response.put("passed", passed);
        response.put("failed", failed);
        response.put("results", results);

        System.out.println(mapper.writeValueAsString(response));
    }
}
