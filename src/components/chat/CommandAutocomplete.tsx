/**
 * CommandAutocomplete — mention suggestions when typing @agent or /agent.
 * Lists available MCP tools with descriptions, supports keyboard navigation.
 */

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { Bot, Wrench } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { getCommandPrefix } from '@/lib/command-parser'
import { MCPService, type MCPTool } from '@/services/mcp.service'

interface CommandAutocompleteProps {
  /** Current input value */
  inputValue: string
  /** Ref to the textarea element for cursor position */
  textareaRef: RefObject<HTMLTextAreaElement | null>
  /** Callback when a tool is selected from the autocomplete */
  onSelect: (toolName: string) => void
  /** Max number of suggestions to show */
  maxResults?: number
}

export function CommandAutocomplete({
  inputValue,
  textareaRef,
  onSelect,
  maxResults = 8,
}: CommandAutocompleteProps) {
  const t = useTheme()
  const [tools, setTools] = useState<MCPTool[]>([])
  const [filteredTools, setFilteredTools] = useState<MCPTool[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const toolsLoadedRef = useRef(false)

  // Load available tools once
  useEffect(() => {
    if (toolsLoadedRef.current) return
    toolsLoadedRef.current = true

    MCPService.listTools()
      .then(setTools)
      .catch(() => {
        // Tools unavailable — autocomplete will be empty
      })
  }, [])

  // Detect command prefix and filter tools
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      setIsVisible(false)
      return
    }

    const cursorPos = textarea.selectionStart
    const prefix = getCommandPrefix(inputValue, cursorPos)

    if (prefix === null) {
      setIsVisible(false)
      return
    }

    const query = prefix.toLowerCase()
    const matches = tools
      .filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query),
      )
      .slice(0, maxResults)

    setFilteredTools(matches)
    setIsVisible(matches.length > 0 || prefix === '')
    setSelectedIndex(0)
  }, [inputValue, tools, maxResults, textareaRef])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredTools.length - 1 ? prev + 1 : 0,
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredTools.length - 1,
          )
          break
        case 'Enter':
        case 'Tab':
          if (filteredTools.length > 0) {
            e.preventDefault()
            onSelect(filteredTools[selectedIndex].name)
            setIsVisible(false)
          }
          break
        case 'Escape':
          setIsVisible(false)
          break
      }
    },
    [isVisible, filteredTools, selectedIndex, onSelect],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.addEventListener('keydown', handleKeyDown)
    return () => textarea.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, textareaRef])

  if (!isVisible) return null

  return (
    <div
      className={`absolute bottom-full left-0 right-0 mb-1 ${t.card} shadow-lg overflow-hidden z-50`}
      role="listbox"
      aria-label="Available agent tools"
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b border-border-default`}
      >
        <Bot className="w-4 h-4 text-brand-accent" />
        <span className={`text-xs font-medium ${t.textMuted}`}>
          Agent Tools
        </span>
      </div>

      {/* Tool list */}
      <div className="max-h-60 overflow-y-auto">
        {filteredTools.length === 0 ? (
          <div className={`px-3 py-4 text-center text-sm ${t.textMuted}`}>
            No matching tools found
          </div>
        ) : (
          filteredTools.map((tool, index) => (
            <button
              key={tool.name}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => {
                onSelect(tool.name)
                setIsVisible(false)
              }}
              className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                index === selectedIndex ? t.active : t.hover
              }`}
            >
              <Wrench className={`w-4 h-4 mt-0.5 shrink-0 ${t.textMuted}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${t.textPrimary} truncate`}>
                  {tool.name}
                </p>
                <p className={`text-xs ${t.textMuted} line-clamp-1`}>
                  {tool.description}
                </p>
                {tool.server && (
                  <p className={`text-[10px] ${t.textMuted} mt-0.5`}>
                    via {tool.server}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div
        className={`px-3 py-1.5 border-t border-border-default text-[10px] ${t.textMuted}`}
      >
        <kbd className="px-1 py-0.5 rounded bg-bg-elevated text-[10px]">Tab</kbd>{' '}
        or{' '}
        <kbd className="px-1 py-0.5 rounded bg-bg-elevated text-[10px]">Enter</kbd>{' '}
        to select
      </div>
    </div>
  )
}
