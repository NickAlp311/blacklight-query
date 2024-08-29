import * as fs from "fs";
import * as progress from "ts-progress";
import { join } from "path";
import { exit } from "process";
import { collect } from "@themarkup/blacklight-collector";
import { reportFailures } from "./utils";

// Gather URLs from input file
if (!fs.existsSync("urls.txt")) {
  console.log(
    "Please create a file named 'urls.txt', containing a newline-separated list of urls to scan."
  );
  exit();
}
const urls = fs.readFileSync("urls.txt", "utf8");
const urlsList = urls.split("\n");
const outDir = "outputs";

let progressBar = progress.create({ total: urlsList.length });

let failedUrls: string[] = [];

// Make output directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Gather scans
(async () => {
  for (let url of urlsList) {
    console.log(`Scanning ${url} ...`);
    const urlObj = new URL(url);
    const folderStructure = `${outDir}/${urlObj.hostname}`;
    const config = {
      headless: true,
      outDir: join(__dirname, folderStructure),
      numPages: 0,
    };

    try {
      await collect(url, config);
    } catch (err) {
      console.log(`${url} failed with error ${err}`);
      failedUrls.push(url);
      fs.rmSync(join(__dirname, folderStructure), {
        recursive: true,
        force: true,
      });
    }

    progressBar.update();
  }

  reportFailures(failedUrls, urlsList.length);
})();