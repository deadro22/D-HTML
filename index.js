const Compiler = require("./compiler/compiler.js");
const fs = require("fs");
const ct = fs.readFileSync(__dirname + "/index.dht").toString();
const http = require("http");

const { compiled, output, error } = Compiler.compile(ct, {
  includeDoc: true,
  inlineStyle: false,
  spacing: 2,
});

/* http
  .createServer((req, res) => {
    if (compiled) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(output);
      res.end();
    } else {
      res.write(
        `<h1>Error compiling...\n<p style='color:red'>${error.message}</p></h1>`
      );
      res.end();
    }
  })
  .listen(5500, () => {
    console.log("Up and running");
  }); */

if (compiled) {
  fs.writeFileSync(__dirname + "/index.html", output);
}
