module.exports.Dictionary = {
  CHARS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#",
  ALLOWED_WORD_SYMBOLS: "-.%",
  WHITESPACE: [" ", "\n", "\t", "\r"],
  LINEBREAK: ["\n", "\r"],
  SYMBOLS: {
    QUOTE_S: "'",
    QUOTE_D: '"',
    LPAR: "(",
    RPAR: ")",
    ASEP: ",",
    PROP_DEC: "$",
  },
  KEYWORDS: [
    "make",
    "end",
    "with",
    "style",
    "attributes",
    "children",
    "template",
    "as",
    "and",
    "import",
    "use",
    "props",
  ],
};

module.exports.Types = {
  STRING: "STRING",
  KEYWORD: "KEYWORD",
  PROP: "PROP",
  PROP_NAME: "PROP_NAME",
  PROP_VALUE: "PROP_VALUE",
  ARG: "ARG",
  PROP_DEC: "PROP_DEC",
  KEYWORDS: {
    MAKE: "MAKE",
    WITH: "WITH",
    END: "END",
    STYLE: "STYLE",
    AS: "AS",
    TEMPLATE: "TEMP",
    AND: "AND",
    CHILDREN: "CHILDREN",
    ATTRIBUTES: "ATTRIBUTES",
    IMPORT: "IMPORT",
    USE: "USE",
    PROPS: "PROPS",
  },
};

class Token {
  constructor(type, value, ln, col) {
    this.type = type;
    this.value = value;
    this.ln = ln;
    this.col = col;
  }
}

module.exports.Token = Token;
