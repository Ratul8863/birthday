import assert from "node:assert/strict";
import {
  getIndexAtPointer,
  getSelectedCenter,
  getTargetRotation,
  normalizeDegrees,
} from "../src/lib/spinner.ts";

function testAlignment(itemCount) {
  let rotation = 0;
  for (let index = 0; index < itemCount; index++) {
    rotation = getTargetRotation(rotation, index, itemCount, 5);
    const landed = getIndexAtPointer(rotation, itemCount);
    assert.equal(
      landed,
      index,
      `Expected index ${index} under pointer, got ${landed} (rotation=${rotation})`,
    );
    const under = normalizeDegrees(-rotation);
    const center = getSelectedCenter(index, itemCount);
    const delta = Math.abs(under - center);
    assert.ok(
      delta < 0.0001 || Math.abs(delta - 360) < 0.0001,
      `Center mismatch ${under} vs ${center}`,
    );
  }
}

testAlignment(8);
testAlignment(10);
console.log("spinner math ok");
