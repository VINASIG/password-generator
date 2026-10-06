import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parse, walk, lexer } from "css-tree";

export function validateCss(source: string): void {
  const tree = parse(source, {
    parseValue: true,
    parseCustomProperty: false,
    onParseError: (error) => {
      throw error;
    },
  });
  walk(tree, function (node) {
    if (node.type === "Declaration" && node.property.startsWith("--"))
      return walk.skip;
    if (node.type === "Raw") {
      if (this.function?.name !== "var") throw new Error("Unparsed CSS");
      parse(node.value, {
        context: "value",
        onParseError: (error) => {
          throw error;
        },
      });
      return walk.skip;
    }
    if (node.type !== "Declaration") return;
    const result = lexer.matchProperty(node.property, node.value);
    if (
      result.error &&
      !result.error.message.includes(
        "Matching for a tree with var() is not supported",
      )
    )
      throw new Error(`Invalid CSS ${node.property}: ${result.error.message}`);
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  for (const file of readdirSync("src/styles").filter((name) =>
    name.endsWith(".css"),
  ))
    validateCss(readFileSync(`src/styles/${file}`, "utf8"));
  console.log("PASS CSS syntax and declaration grammar");
}
