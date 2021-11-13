const {
  DDocNode,
  MakeNode,
  TextNode,
  TemplateGetNode,
  TemplateNode,
  ImportNode,
  UseNode,
  StyleNode,
  StyleChildNode,
  PropDec,
} = require("./nodes");
const { DocContent, rndId } = require("./utils");
const fs = require("fs");
const Lexer = require("./lexer");
const Parser = require("./parser");
const path = require("path");

const ALLOWED_EXTENSIONS = [".css", ".dht"];

const SPECIAL_TAGS = ["DOCTYPE"];

const SELF_CLOSING = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  "DOCTYPE",
];

module.exports = class Interpreter {
  constructor() {
    this.output = "";
    this.body = "";
    this.head = "";
    this.lnspc = 1;
    this.style = "";
    this.templates = {};
    this.importQueue = "";
    this.importUse = {};
    this.templatesProps = {};
  }

  visit($node, config) {
    switch (true) {
      case $node.constructor.name === DDocNode.name:
        $node.children.forEach((c) => {
          this.body += this.visit(c, config) + "\n";
        });
        if (config?.includeDoc) {
          this.head += `\n<style>${this.style}</style>\n`;
          this.output += DocContent(this.head, this.body);
        } else {
          this.output = this.body;
        }
        break;

      case $node.constructor.name === MakeNode.name:
        const wts = " ".repeat(this.lnspc);
        const eltg = "dh-" + rndId(6);
        this.lnspc += config.spacing || 1;
        let to =
          wts + `<${SPECIAL_TAGS.includes($node.el) ? "!" : ""}${$node.el}`;
        let ctnt = "";
        let initalClass = "";

        if ($node.attr) {
          const at = $node.attr;
          at.children.forEach((ca) => {
            if (ca.key === "class") {
              initalClass += ca.value + " ";
            } else {
              ctnt += ` ${ca.key}${ca.value ? "='" + ca.value + "'" : ""}`;
            }
          });
        }

        if ($node.style) {
          ctnt = ` class='${eltg}${
            initalClass !== "" ? " " + initalClass.trim() : ""
          }'${ctnt}`;
          const st = $node.style;
          if (config.inlineStyle) {
            ctnt += " style='";
            let tmpSt = "";
            st.children.forEach((stc) => {
              tmpSt += `${stc.prop}:${stc.values.map((c) => c)};`;
            });
            ctnt += tmpSt + "'";
          } else {
            let tmpStHead = "\n." + eltg + "{\n";
            st.children.forEach((stc) => {
              let r = "";

              if (stc.constructor.name === UseNode.name) {
                if (
                  !this.templates[stc.name] ||
                  this.templates[stc.name].type !== "css"
                ) {
                  throw new Error("Undefined css template " + stc.name);
                }
                tmpStHead += this.templates[stc.name].content + "\n";
              } else {
                stc.values.forEach((c) => {
                  r += c + " ";
                });
                tmpStHead += `${stc.prop}:${r.trim()};\n`;
              }
            });
            tmpStHead += "}\n";
            this.style += tmpStHead;
          }
        } else {
          if (initalClass !== "") {
            ctnt = ` class='${initalClass.trim()}'` + ctnt;
          }
        }

        to += ctnt;

        if (!SELF_CLOSING.includes($node.el)) {
          if ($node.children.length > 0) {
            to += ">\n";
            $node.children.forEach((c) => {
              to +=
                this.visit(c, config) +
                (c.constructor.name !== MakeNode.name ? "" : "\n");
            });
            to += wts + `</${$node.el}>`;
          } else {
            to += ">";
            to += `</${$node.el}>`;
          }
        } else {
          to += "/>";
        }

        this.lnspc -= config.spacing || 1;
        return to;

      case $node.constructor.name === TextNode.name:
        return " ".repeat(this.lnspc) + $node.value;

      case $node.constructor.name === TemplateNode.name:
        if ($node.type === "css") {
          this.templates[$node.name] = {
            type: "css",
            content: this.visitStyle($node.child, config),
          };
        } else {
          this.templates[$node.name] = {
            type: "html",
            content: this.visit($node.child, config),
          };
        }
        break;

      case $node.constructor.name === TemplateGetNode.name:
        if (
          !this.templates[$node.name] ||
          this.templates[$node.name].type !== "html"
        )
          throw new Error("Undefined html template " + $node.name);

        let r = this.templates[$node.name].content;

        $node.props &&
          $node.props.forEach((p) => {
            const rg = new RegExp(`{{${p.name}}}`, "g");
            r = r.replace(rg, p.value);
          });

        return r.replace(/{{(.*?)}}/g, "");

      /* 
        Look for any imports in the file and if found iterate through them recursively
        and look for other imports inside of imported files. Only get declared templates
        and add them to the current templates scope
      */
      case $node.constructor.name === ImportNode.name:
        const ext = path.extname($node.path);

        if (!ALLOWED_EXTENSIONS.includes(ext))
          throw new Error("Only css and dht files can be imported");

        let d;
        try {
          d = fs.readFileSync($node.path).toString();
        } catch (e) {
          if (e.code === "ENOENT") {
            throw new Error(`Imported file ${$node.path} does not exist`);
          } else {
            throw e;
          }
        }

        if (ext === ".css") {
          this.head += `\n<style>\n${d.trim()}\n</style>\n`;
          break;
        }

        const tokens = Lexer.run(d);
        const chp = Parser.run(tokens).children;

        const temps = chp.filter(
          (ch) => ch.constructor.name === TemplateNode.name
        );
        const imports = chp.filter(
          (ch) => ch.constructor.name === ImportNode.name
        );
        if ($node.name) {
          const makeQ = chp.filter(
            (ch) => ch.constructor.name === MakeNode.name
          );

          if (this.importUse[$node.name])
            throw new Error("an imported file with this name already exists");

          if (makeQ.length > 0) {
            this.importUse[$node.name] = makeQ.map((t) =>
              this.visit(t, config).trim()
            );
          } else {
            throw new Error("No make calls were exported from " + $node.path);
          }
        }

        imports.length > 0 && imports.map((t) => this.visit(t, config));
        temps.length > 0 && temps.map((t) => this.visit(t, config));
        break;

      case $node.constructor.name === UseNode.name:
        if (!this.importUse[$node.name])
          throw new Error("Undefined imported file name " + $node.name);
        return this.importUse[$node.name];

      case $node.constructor.name === PropDec.name:
        return `{{${$node.name}}}`;

      default:
        throw new Error("Node unhandled " + $node.constructor.name);
    }
    return this.output;
  }

  visitStyle($node, config) {
    switch (true) {
      case $node.constructor.name === StyleNode.name:
        let c = "";
        $node.children.forEach((ch) => {
          c += this.visitStyle(ch, config);
        });
        return c;

      case $node.constructor.name === StyleChildNode.name:
        let val = "";
        $node.values.forEach((f) => {
          val += f + " ";
        });
        return `  ${$node.prop}:${val.trim()};\n`;
    }
  }

  static run($node, config) {
    const itInstnace = new Interpreter();
    const res = itInstnace.visit($node, config).trim();
    return res;
  }
};
