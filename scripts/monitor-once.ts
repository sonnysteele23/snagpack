// Run a single scan cycle from the CLI (handy for cron via GitHub Actions,
// or a quick local check). Usage: npm run monitor:once
import { runMonitor } from "../src/lib/monitor";

runMonitor()
  .then((s) => {
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
