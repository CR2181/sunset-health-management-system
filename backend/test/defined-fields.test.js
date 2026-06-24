const assert = require("node:assert/strict");
const test = require("node:test");
const { pickDefinedFields } = require("../dist/common/defined-fields.js");

test("keeps only fields actually submitted in partial DTOs", () => {
  assert.deepEqual(pickDefinedFields({ name: undefined, room: "2F-208", note: null }), { room: "2F-208", note: null });
});
