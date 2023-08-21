/*
Stress tests.   

Reading and writing bigger data is often done by chunking it, so it's critical to
test that this is working properly by reading and writing larger data, and confirming
that it works.
*/

import * as tmp from "tmp-promise";
import bind from "../bind";
import { join } from "path";
import fs from "fs/promises";
import { MAX_WRITE_BLOCK_LENGTH } from "../../sftp/sftp-client";

let dir1, dir2, fuse, target;

beforeAll(async () => {
  dir1 = await tmp.dir({ unsafeCleanup: true });
  dir2 = await tmp.dir({ unsafeCleanup: true });
  fuse = await bind(dir1.path, dir2.path);
  target = dir2.path;
});

afterAll(async () => {
  await dir1?.cleanup();
  await dir2?.cleanup();
  await fuse?.unmount();
});

async function clean() {
  for (const file of await fs.readdir(target)) {
    await fs.rm(join(target, file), { recursive: true });
  }
}

describe("stress writeFile(path, data[, options])", () => {
  // Make the data big to also stress test writing/chunking!
  const length = MAX_WRITE_BLOCK_LENGTH + 1;
  const data = Array.from({ length }, () =>
    String.fromCharCode(Math.floor(Math.random() * 26) + 97),
  ).join("");

  it(`Create a file at root (writeFile.txt) of length ${data.length}`, async () => {
    await clean();
    const path = join(target, "writeFile.txt");
    await fs.writeFile(path, data);
    expect(await fs.readFile(path, "utf8")).toEqual(data);
  });
});
