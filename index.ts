import { readFileSync } from "fs"
import * as readline from "readline"

const main = (args: string[]): void => {
  if(args.length > 1) {
    console.log("Usage: tslox [script]")
    process.exit(1)
  }

  if (args.length === 0) {
    runRepl()
  } else {

    // print the arg, probably this will be the script
    const filePath = args[0]
    console.log("Gonna scan " + filePath)

    try {
      const buf = readFileSync(filePath)
      const str = buf.toString();
      runFile(str)
    } catch (e: unknown) {
      console.error(`Unable to read file at ${filePath}`)
      if (e instanceof Error) {
        console.error(e.message)
      }
    }
  }
}

const runFile = (code: string): void => {
  console.log(code);
}

const runRepl = (): number => {
  console.log("Repl time!")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.on("line", (input: string) => {
    if (input.trim().toLowerCase() == "exit") {
      console.log("Exiting Repl. Goodbye!")
      rl.close()
      return
    }
    console.log(`Echo: ${input}`)
    rl.prompt()
  })

  rl.setPrompt("λ ")
  rl.prompt()
  return 0
}

// argv[0]: node executable path
// argv[1]: this file path
// argv[2..]: the good stuff  
const args = process.argv.slice(2)

main(args)
