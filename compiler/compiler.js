const Lexer = require("./src/lexer");
const Parser = require("./src/parser");
const util = require("util");
const Interpreter = require("./src/interpreter");

module.exports = class Compiler {
  static compile(content, config) {
    try {
      const rs = content;
      const tokens = Lexer.run(rs);
      //console.log(tokens);
      const AST = Parser.run(tokens, rs);
      //console.log(util.inspect(AST, false, null, true));
      const output = Interpreter.run(AST, config);
      //console.log(output);
      return { compiled: true, output, error: null };
    } catch (e) {
      //console.log(e);
      console.log(`\x1b[31m\x1b[1m${e.message}\x1b[0m`);
      process.exit(0);
      return { compiled: false, output: null, error: e };
    }
  }
};
