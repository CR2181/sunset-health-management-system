const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulesRoot = path.resolve(__dirname, "..", "src", "modules");
const protectedControllers = [
  "residents/residents.controller.ts",
  "care-tasks/care-tasks.controller.ts",
  "alerts/alerts.controller.ts",
  "cameras/cameras.controller.ts",
  "devices/devices.controller.ts",
  "device-events/device-events.controller.ts",
  "ai-events/ai-events.controller.ts",
  "dashboard/dashboard.controller.ts",
];

for (const file of protectedControllers) {
  const source = fs.readFileSync(path.join(modulesRoot, file), "utf8");
  const controllerIndex = source.indexOf("@Controller(");
  const classIndex = source.indexOf("export class ");
  const classDecorators = source.slice(controllerIndex, classIndex);

  assert.ok(
    classDecorators.includes("@UseGuards(JwtAuthGuard, RolesGuard)"),
    `${file} must require JWT and role guards at controller level`,
  );
  assert.ok(classDecorators.includes("@Roles("), `${file} must declare controller-level roles`);
}

const authController = fs.readFileSync(
  path.resolve(__dirname, "..", "src", "auth", "auth.controller.ts"),
  "utf8",
);
assert.ok(!authController.includes('@Post("register")'), "public registration must be disabled");

console.log("HTTP security contract tests passed");
