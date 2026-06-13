import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(
  __dirname,
  "../data/project.json"
);

const data = JSON.parse(
  fs.readFileSync(dataPath, "utf8")
);

const templates = [
  {
    template: "proposal.html",
    output: "proposal-output.html"
  },
  {
    template: "agreement.html",
    output: "agreement-output.html"
  },
  {
    template: "invoice.html",
    output: "invoice-output.html"
  },
  {
    template: "handover.html",
    output: "handover-output.html"
  }
];

templates.forEach(doc => {
  const templatePath = path.join(
    __dirname,
    "../templates",
    doc.template
  );

  const templateSource =
    fs.readFileSync(templatePath, "utf8");

  const compiled =
    Handlebars.compile(templateSource);

  const html =
    compiled(data);

  const outputPath = path.join(
    __dirname,
    "../../",
    doc.output
  );

  fs.writeFileSync(
    outputPath,
    html
  );

  console.log(`✅ Generated ${doc.output}`);
});