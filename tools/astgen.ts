import { createWriteStream, WriteStream } from "fs"

const main = (args: string[]): void => {
  if(args.length > 1) {
    console.log("Usage: astgen [output_dir]")
    process.exit(1)
  }

  // print the arg, probably this will be the script
  const outputDir = args[0]
  console.log(`Gonna output to ${outputDir}`)

  try {
    defineAst(outputDir, "Expr", {
      "Assign": "name: Token, value: Expr",
      "Binary": "left: Expr, operator: Token, right: Expr",
      "Call": "callee: Expr, paren: Token, args: Expr[]",
      "Get": "obj: Expr, name: Token",
      "Grouping": "expression: Expr",
      "Literal": "value: Object",
      "Logical": "left: Expr, operator: Token, right: Expr",
      "Setter": "obj: Expr, name: Token, value: Expr",
      "Unary": "operator: Token, right: Expr",
      "Variable": "name: Token",
    })

    defineAst(outputDir, "Stmt", {
      "Block": "statements: Stmt[]",
      "Class": "name: Token, methods: Function[]",
      "Expression": "expression: Expr",
      "Function": "name: Token, params: Token[], body: Stmt[]",
      "If": "condition: Expr, thenBranch: Stmt, elseBranch: Stmt|null",
      "Print": "expression:  Expr",
      "Return": "keyword: Token, value: Expr|null",
      "Var": "name: Token, initializer: Expr|null",
      "While": "condition: Expr, body: Stmt",
    })
  } catch (e: unknown) {
    console.log(`Error generating AST: ${e}`)
  }
}

const defineAst = (outputDir: string, basename: string, types: Record<string, string>) => {
  const filepath = `${outputDir}/${basename.toLowerCase()}.ts`
  const st = createWriteStream(filepath, { flags: "w" })
  if (basename === "Stmt") {
    // Stmt depends on Expr, so import it
    st.write("import { Expr } from \"./expr\"\n")
  }
  st.write("import { Token } from \"../token\"\n")
  st.write("\n")
  writeLine(st, `export abstract class ${basename} {`)
  writeLine(st, `  abstract accept<T>(visitor: Visitor<T>): T`)
  writeLine(st, `}`)
  writeLine(st, ``)

  defineVisitor(st, basename, types)

  Object.entries(types).forEach(([classname, value]) => {
    const fields = value.trim()
    defineType(st, basename, classname, fields)
  });
}

const defineType = (st: WriteStream, basename: string, classname: string, fieldList: string) => {
  writeLine(st, `export class ${classname} extends ${basename} {`)

  // Field list
  const fields = fieldList.split(",")
  fields.forEach((field) => {
    writeLine(st, `  ${field.trim()}`)
  })
  writeLine(st, "")

  // Constructor
  writeLine(st, `  constructor(${fieldList}) {`)
  writeLine(st, `    super()`)
  fields.forEach((field) => {
    const fieldname = field.split(":")[0].trim()
    writeLine(st, `    this.${fieldname} = ${fieldname}`)
  })
  writeLine(st, `  }`)
  writeLine(st, ``)

  // Implement accept method for visitor pattern
  writeLine(st, `  accept<T>(visitor: Visitor<T>) {`)
  writeLine(st, `    return visitor.visit${classname}${basename}(this)`)
  writeLine(st, `  }`)
  writeLine(st, ``)

  // Close class
  writeLine(st, `}`)
  writeLine(st, ``)
}

const defineVisitor = (st: WriteStream, basename: string, types: Record<string, string>) => {
  writeLine(st, `export interface Visitor<T> {`)

  Object.entries(types).forEach(([classname, fieldList]) => {
    writeLine(st, `  visit${classname}${basename}(${basename.toLowerCase()}: ${classname}): T`)
  })

  writeLine(st, `}`)
  writeLine(st, ``)
}

const writeLine = (st: WriteStream, line: string) => {
  st.write(line + "\n")
}

// argv[0]: node executable path
// argv[1]: this file path
// argv[2..]: the good stuff  
const args = process.argv.slice(2)

main(args)
