module.exports.DocContent = (head, body) => `<!DOCTYPE html>
<html lang="en">
<head>${head}</head>
<body>${body}</body>
</html>`;

module.exports.rndId = (len) => {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports.retrieveErrorSource = (lexer, s) => {
  const sourceLines = lexer.source.split("\r\n");
  let errorSrc = "";
  let start = lexer.ln - s;
  for (let i = 0; i < s; i++) {
    const lnId = start + i + 1;
    const ln = sourceLines[start + i];
    if (ln) {
      errorSrc += " " + lnId + " | " + ln + "\n";
      if (lnId === lexer.ln) {
        errorSrc += "     " + "^".repeat(ln.length);
      }
    }
  }
  return errorSrc;
};
