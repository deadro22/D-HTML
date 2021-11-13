const { Dictionary, Token, Types } = require("./tokens");
const { retrieveErrorSource } = require("./utils");

class LexerError {
  constructor(lexer) {
    this.lexer = lexer;
  }

  throwIllegalCharacter() {
    throw new SyntaxError(
      `Illegal character ${this.lexer.char} at line ${this.lexer.ln}:${
        this.lexer.col
      }\n\n${retrieveErrorSource(this.lexer, 3)}\n`
    );
  }

  throwUnexpected() {
    throw new SyntaxError(
      `Unexpected ${this.lexer.char} at line ${this.lexer.ln}:${this.lexer.col}`
    );
  }

  throwExpected() {
    throw new SyntaxError(
      `Expected ${this.lexer.char} at line ${this.lexer.ln}:${this.lexer.col}`
    );
  }
}

module.exports = class Lexer {
  constructor(source) {
    this.ln = 1;
    this.col = 0;
    this.char = "";
    this.charIndex = -1;
    this.source = source;
    this.tokens = [];
    this.isProp = true;
    this.next();
    this.error = new LexerError(this);
  }

  next() {
    this.col += 1;
    this.charIndex += 1;
    this.char = this.source[this.charIndex];

    if (this.char === "\n") {
      this.ln += 1;
      this.col = 1;
      this.isProp = true;
    }

    if (!this.char) {
      this.char = null;
    }
  }

  addToken(type, value, ln, col) {
    this.tokens.push(new Token(type, value, ln, col));
  }

  generate() {
    while (this.char !== null) {
      switch (true) {
        case Dictionary.WHITESPACE.includes(this.char):
          this.next();
          break;

        case Dictionary.CHARS.includes(this.char.toUpperCase()):
          this.wordToken();
          break;

        case this.char === Dictionary.SYMBOLS.QUOTE_S ||
          this.char === Dictionary.SYMBOLS.QUOTE_D:
          this.stringToken();
          break;

        case this.char === Dictionary.SYMBOLS.RPAR:
          this.addToken(Dictionary.SYMBOLS.RPAR, null, this.ln, this.col);
          this.next();
          break;

        case this.char === Dictionary.SYMBOLS.LPAR:
          this.addToken(Dictionary.SYMBOLS.LPAR, null, this.ln, this.col);
          this.next();
          break;

        case this.char === Dictionary.SYMBOLS.ASEP:
          this.addToken(Dictionary.SYMBOLS.ASEP, null, this.ln, this.col);
          this.next();
          break;

        case this.char === Dictionary.SYMBOLS.PROP_DEC:
          this.propToken();
          break;

        default:
          this.error.throwIllegalCharacter();
      }
    }
    return this.tokens;
  }

  propToken() {
    const ln = this.ln;
    const col = this.col;
    let propValue = "";
    this.next();

    while (
      Dictionary.ALLOWED_WORD_SYMBOLS.includes(this.char) ||
      Dictionary.CHARS.includes(this.char.toUpperCase())
    ) {
      propValue += this.char;
      this.next();
    }

    this.addToken(Types.PROP_DEC, propValue, ln, col);
  }

  wordToken() {
    const ln = this.ln;
    const col = this.col;
    let wordValue = this.char;
    this.next();

    while (
      this.char !== null &&
      (Dictionary.ALLOWED_WORD_SYMBOLS.includes(this.char) ||
        Dictionary.CHARS.includes(this.char.toUpperCase()))
    ) {
      wordValue += this.char;
      this.next();
    }

    let tp = "";
    const upw = wordValue.toUpperCase();

    if (Dictionary.KEYWORDS.includes(wordValue)) {
      tp = Types.KEYWORDS[upw];
    } else {
      if (this.isProp) {
        tp = Types.PROP_NAME;
      } else {
        tp = Types.PROP_VALUE;
      }
    }

    if (wordValue === Dictionary.KEYWORDS[7]) {
      this.isProp = false;
    }

    this.addToken(tp, wordValue, ln, col);
  }

  stringToken() {
    const startingQuote = this.char;
    const ln = this.ln;
    const col = this.col;
    this.next();
    let stringValue = "";

    while (
      this.char !== null &&
      this.char !== startingQuote &&
      !Dictionary.LINEBREAK.includes(this.char)
    ) {
      stringValue += this.char;
      this.next();
    }

    if (
      this.char !== startingQuote &&
      (this.char === Dictionary.SYMBOLS.QUOTE_S ||
        this.char === Dictionary.SYMBOLS.QUOTE_D)
    )
      this.error.throwUnexpected();

    if (Dictionary.LINEBREAK.includes(this.char) || this.char === null)
      this.error.throwExpected();

    this.addToken(Types.STRING, stringValue, ln, col);
    this.next();
  }

  static run(source) {
    return new Lexer(source).generate();
  }
};
