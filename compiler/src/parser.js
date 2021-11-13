const {
  DDocNode,
  MakeNode,
  StyleNode,
  StyleChildNode,
  AttributesChildNode,
  AttributesNode,
  TemplateNode,
  TextNode,
  TemplateGetNode,
  ImportNode,
  UseNode,
  Prop,
  PropDec,
} = require("./nodes");
const { Types } = require("./tokens");

class ParserError {
  constructor(parser) {
    this.parser = parser;
  }
  throwExpected(m) {
    throw new Error(
      `Expected ${m}` +
        (this.parser.token !== null
          ? ` at line ${this.parser.token.ln}:${this.parser.token.col}`
          : "")
    );
  }

  throwUnexpected() {
    throw new Error(
      `Unexpected ${this.parser.token.value} at line ${this.parser.token.ln}:${this.parser.token.col}`
    );
  }

  throwUnexpectedToken() {
    throw new Error(
      `Unexpected token ${this.parser.token.value} at line ${this.parser.token.ln}:${this.parser.token.col}`
    );
  }

  throwImport(type) {
    switch (type) {
      case "duplicate":
        throw new Error(`File already imported: '${this.parser.token.value}'`);
      case "top":
        throw new Error("Import can only be at the top of the file");
      case "scope":
        throw new Error(
          "Unexpected lower level import, import can only be called at the top level"
        );
    }
  }

  throwTemplate() {}
}

module.exports = class Parser {
  constructor(tokens) {
    this.token = "";
    this.tokens = tokens;
    this.tokenIndex = -1;
    this.ast = new DDocNode("DHDOC");
    this.nonImport = false;
    this.imports = {};
    this.error = new ParserError(this);
    this.next();
  }

  next() {
    this.tokenIndex += 1;
    this.token = this.tokens[this.tokenIndex];

    if (!this.token) {
      this.token = null;
    }
  }

  parse() {
    this.ast.children = this._expression();

    return this.ast;
  }

  _expression() {
    let ae = [];
    while (this.token !== null) {
      if (this.token.type !== Types.KEYWORDS.IMPORT) {
        this.nonImport = true;
      }

      switch (true) {
        case this.token.type === Types.KEYWORDS.MAKE:
          ae.push(this.makeNode());
          break;

        case this.token.type === Types.KEYWORDS.TEMPLATE:
          ae.push(this.templateNode());
          break;

        case this.token.type === Types.KEYWORDS.USE:
          this.next();
          if (this.token && this.token.type !== Types.STRING)
            this.error.throwExpected("string");

          ae.push(new UseNode(this.token.value));
          this.next();
          break;

        case this.token.type === Types.KEYWORDS.IMPORT:
          if (this.nonImport) this.error.throwImport("top");
          this.next();
          if (this.token.type !== Types.STRING)
            this.error.throwExpected("string after import");

          if (this.imports[this.token.value])
            this.error.throwImport("duplicate");

          const inode = new ImportNode(this.token.value, null);
          this.imports[this.token.value] = true;

          this.next();

          if (this.token && this.token.type === Types.KEYWORDS.AS) {
            this.next();
            if (this.token.type !== Types.STRING)
              this.error.throwExpected("import name after import");

            inode.name = this.token.value;
            this.next();
          }

          ae.push(inode);

          break;

        default:
          this.error.throwUnexpectedToken();
      }
    }
    return ae;
  }

  templateNode() {
    let res = new TemplateNode("html", null, null);
    this.next();

    if (this.token.type !== Types.STRING)
      this.error.throwExpected("string as the name of the template");
    res.name = this.token.value;

    this.next();
    if (
      this.token.type !== Types.KEYWORDS.MAKE &&
      this.token.type !== Types.KEYWORDS.STYLE
    )
      throw new Error("Template definition missing make or style keyword");

    if (this.token.type === Types.KEYWORDS.STYLE) {
      res.child = this.styleNode();
      res.type = "css";
      this.next();
      return res;
    }

    res.child = this.makeNode();

    return res;
  }

  makeNode() {
    if (this.token.type === Types.STRING) {
      const tc = new TextNode(this.token.value);
      this.next();
      return tc;
    }

    if (this.token.type === Types.KEYWORDS.USE) {
      this.next();

      if (this.token.type !== Types.STRING)
        this.error.throwExpected("string after use call");

      const usn = new UseNode(this.token.value);
      this.next();
      return usn;
    }

    if (this.token.type === Types.KEYWORDS.IMPORT)
      this.error.throwImport("scope");

    if (this.token.type === Types.KEYWORDS.TEMPLATE)
      this.error.throwUnexpected(
        "lower level template, templates can only be declared at the top level"
      );

    let res = new MakeNode(null, null, null, []);
    this.next();

    if (this.token === null) this.error.throwExpected("end keyword");

    if (this.token.type !== Types.PROP_NAME && this.token.type !== Types.STRING)
      this.error.throwExpected(
        "element name or template name found " + this.token.value
      );

    if (this.token.type === Types.STRING) {
      res = new TemplateGetNode(this.token.value, null);
      this.next();

      if (
        this.token.type !== Types.KEYWORDS.END &&
        this.token.type !== Types.KEYWORDS.WITH
      )
        this.error.throwExpected("end or with keyword after template call");

      if (this.token.type === Types.KEYWORDS.END) {
        this.next();
        return res;
      }
      this.next();

      if (this.token.type === Types.KEYWORDS.PROPS) {
        res.props = [];
        this.next();

        if (this.token.type !== Types.PROP_NAME)
          this.error.throwExpected("property name");

        while (
          this.token !== null &&
          this.token.type !== Types.KEYWORDS.END &&
          this.token.type !== Types.KEYWORDS.AND
        ) {
          const pr = new Prop(this.token.value, null);
          this.next();

          if (this.token.type !== Types.KEYWORDS.AS)
            this.error.throwExpected("as keyword after prop");

          this.next();

          if (this.token.type !== Types.STRING)
            this.error.throwExpected("string as the property value");

          pr.value = this.token.value;
          //this.next();
          res.props.push(pr);
          this.next();
        }
        this.next();
        return res;
      }

      if (
        this.token?.type !== Types.KEYWORDS.END &&
        this.token?.type !== Types.KEYWORDS.WITH
      )
        this.error.throwExpected("end or with keyword after template call");
      this.next();
      return res;
    }

    res.el = this.token.value;

    this.next();

    if (this.token.type === Types.KEYWORDS.END) {
      this.next();
      return res;
    }

    if (
      this.token.type !== Types.KEYWORDS.WITH &&
      this.token.type !== Types.KEYWORDS.END
    )
      this.error.throwExpected(
        "keyword with or end, found " + this.token.value
      );

    this.next();

    const ln = this.token;

    while (this.token !== null && this.token.type !== Types.KEYWORDS.END) {
      switch (true) {
        case this.token.value.toUpperCase() === Types.KEYWORDS.STYLE:
          res.style = this.styleNode();
          break;

        case this.token.type === Types.KEYWORDS.MAKE:
          res.children.push(this.makeNode());
          break;

        case this.token.type === Types.KEYWORDS.ATTRIBUTES:
          res.attr = this.attributesNode();
          break;

        case this.token.type === Types.KEYWORDS.AND:
          this.next();
          break;

        case this.token.type === Types.KEYWORDS.CHILDREN:
          this.next();

          while (
            this.token !== null &&
            this.token.type !== Types.KEYWORDS.END &&
            this.token.type !== Types.KEYWORDS.AND
          ) {
            if (this.token.type === Types.PROP_DEC) {
              res.children.push(new PropDec(this.token.value));
              this.next();
            } else {
              res.children.push(this.makeNode());
            }
          }

          break;

        default:
          this.error.throwUnexpected();
      }
    }

    if (this.token === null)
      this.error.throwExpected("end keyword at line " + ln.ln + ":" + ln.col);
    this.next();

    return res;
  }

  attributesNode() {
    let res = new AttributesNode([]);
    this.next();

    if (this.token.type !== Types.PROP_NAME)
      this.error.throwExpected("attribute");

    while (
      this.token !== null &&
      this.token.type !== Types.KEYWORDS.AND &&
      this.token.type !== Types.KEYWORDS.END
    ) {
      const at = new AttributesChildNode(this.token.value);
      this.next();

      if (this.token.type === Types.KEYWORDS.AS) {
        this.next();

        if (this.token.type !== Types.STRING)
          throw new Error(
            "Invalid attribute value, attribute value can only be a string"
          );
        at.value = this.token.value;
      } else if (
        this.token.type === Types.PROP_NAME ||
        this.token.type === Types.KEYWORDS.END
      ) {
        res.children.push(at);
        continue;
      } else {
        if (this.token.type === Types.KEYWORDS.TEMPLATE)
          throw new Error(
            "Unexpected lower level template, templates can only be declared at the top level"
          );

        if (this.token.type === Types.KEYWORDS.IMPORT)
          throw new Error(
            "Unexpected lower level import, import can only be called at the top level"
          );

        this.error.throwExpected("as keyword");
      }

      res.children.push(at);
      this.next();
    }

    return res;
  }

  styleNode() {
    let res = new StyleNode([]);
    this.next();

    if (!this.token.type === Types.PROP_NAME)
      this.error.throwExpected("css property");

    while (
      this.token !== null &&
      this.token.type !== Types.KEYWORDS.AND &&
      this.token.type !== Types.KEYWORDS.END
    ) {
      res.children.push(this.stylePropNode());
    }

    return res;
  }

  stylePropNode() {
    if (this.token.type === Types.KEYWORDS.USE) {
      this.next();

      if (this.token.type !== Types.STRING)
        this.error.throwExpected("string after css template call");

      const r = new UseNode(this.token.value);
      this.next();
      return r;
    }

    let res = new StyleChildNode(this.token.value, []);
    this.next();

    if (this.token.type === Types.KEYWORDS.AS) {
      this.next();
      if (this.token.type !== Types.PROP_VALUE)
        this.error.throwExpected("css property value");

      while (this.token !== null && this.token.type === Types.PROP_VALUE) {
        res.values.push(this.token.value);
        this.next();
      }
    } else if (
      this.token.type !== Types.KEYWORDS.AND &&
      this.token.type !== Types.KEYWORDS.END
    ) {
      this.error.throwExpected("css property value");
    }

    return res;
  }

  static run(tokens, rs) {
    return new Parser(tokens).parse();
  }
};
