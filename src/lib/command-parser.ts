/**
 * Command Parser — detects @agent and /agent commands in message input,
 * extracts tool name and arguments for MCP tool invocation.
 */

export interface ParsedCommand {
  /** The full matched text (e.g., "@agent remember_search query text") */
  raw: string
  /** Tool name (e.g., "remember_search") */
  toolName: string
  /** Parsed arguments as key-value or positional string */
  args: Record<string, unknown>
  /** Start index of the command in the input string */
  startIndex: number
  /** End index of the command in the input string */
  endIndex: number
}

/**
 * Pattern: @agent <tool> [args...] or /agent <tool> [args...]
 *
 * Examples:
 *   @agent remember_search "vacation photos"
 *   /agent remember_create title="My Memory" content="Some content"
 *   @agent remember_query scope=personal limit=10
 */
const COMMAND_PATTERN = /(?:@agent|\/agent)\s+(\S+)(?:\s+(.*))?/i

/**
 * Parse a message input string for agent commands.
 * Returns null if no command is detected.
 */
export function parseCommand(input: string): ParsedCommand | null {
  const match = COMMAND_PATTERN.exec(input)
  if (!match) return null

  const toolName = match[1]
  const argsStr = match[2]?.trim() ?? ''
  const args = parseArgs(argsStr)

  return {
    raw: match[0],
    toolName,
    args,
    startIndex: match.index,
    endIndex: match.index + match[0].length,
  }
}

/**
 * Check if an input string contains an agent command.
 */
export function hasCommand(input: string): boolean {
  return COMMAND_PATTERN.test(input)
}

/**
 * Extract the command prefix being typed (for autocomplete triggering).
 * Returns the partial tool name if the user is mid-command, null otherwise.
 *
 * Example: "@agent rem" -> "rem"
 *          "@agent " -> ""
 *          "hello" -> null
 */
export function getCommandPrefix(
  input: string,
  cursorPosition: number,
): string | null {
  // Look backwards from cursor for @agent or /agent
  const textBeforeCursor = input.slice(0, cursorPosition)
  const prefixMatch = /(?:@agent|\/agent)\s+(\S*)$/i.exec(textBeforeCursor)
  if (!prefixMatch) return null
  return prefixMatch[1]
}

/**
 * Parse argument string into key-value pairs.
 *
 * Supported formats:
 * - key=value pairs: `scope=personal limit=10`
 * - key="quoted value": `title="My Memory"`
 * - Positional (becomes { query: "..." }): `"vacation photos"`
 * - Mixed: `title="Trip" vacation photos` -> { title: "Trip", query: "vacation photos" }
 */
function parseArgs(argsStr: string): Record<string, unknown> {
  if (!argsStr) return {}

  const args: Record<string, unknown> = {}
  let remaining = argsStr
  const positionalParts: string[] = []

  // Extract key=value and key="quoted value" pairs
  const KV_PATTERN = /(\w+)=(?:"([^"]*)"|(\S+))/g
  let kvMatch: RegExpExecArray | null

  while ((kvMatch = KV_PATTERN.exec(argsStr)) !== null) {
    const key = kvMatch[1]
    const value = kvMatch[2] ?? kvMatch[3]
    args[key] = coerceValue(value)

    // Remove matched portion from remaining
    remaining = remaining.replace(kvMatch[0], '')
  }

  // Remaining text becomes the positional "query" arg
  const trimmed = remaining.trim()
  if (trimmed) {
    // Strip wrapping quotes
    const unquoted = trimmed.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    args.query = unquoted
  }

  return args
}

/**
 * Coerce string values to appropriate types.
 */
function coerceValue(value: string): unknown {
  // Boolean
  if (value === 'true') return true
  if (value === 'false') return false

  // Number
  const num = Number(value)
  if (!isNaN(num) && value !== '') return num

  return value
}
