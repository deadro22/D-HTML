interface DHCompilerConfig {
  /**
   *  @param includeDoc Should add an html document template after compilation
   * */
  includeDoc?: Boolean;
  /**
   *  @param styleCompilation Use inline style after compilation instead of appending it to
   * the head or in a seperate file
   * */
  styleCompilation?: "default" | "inline" | "seperate";
  /**
   *  @param spacing Spacing prefix added before every generated html tag
   * */
  spacing?: Number;
}

interface DHCompilationResult {
  compiled: Boolean;
  output: String;
  error: Error;
}

namespace Compiler {
  const compile = function(
    content: String,
    config: DHCompilerConfig
  ): DHCompilationResult
}

export = Compiler;
