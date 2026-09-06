require("dotenv").config({ quiet: true });
process.env.JWT_SECRET ||= "local-test-secret-only";
