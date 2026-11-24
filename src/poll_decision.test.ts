import { strict as assert } from "node:assert";
import { winningOption } from "./poll_service.ts";

const votes = { red: 2, blue: 1 };
assert.equal(winningOption(votes), "red");
console.log("poll decision: red wins with 2 votes");
