import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/lib/theming'
import { useToast } from '@prmichaelsen/pretty-toasts/standalone'
import { PRESET_THEMES, PRESET_THEME_NAMES } from '@/lib/theme-presets'
import { getVariablesByGroup, THEME_VARIABLE_GROUPS, shortKeyToCssVar } from '@/lib/theme-variables'
import { exportThemeYaml } from '@/lib/theme-yaml'
import { saveThemeToApi, loadThemeFromApi, setThemeCookie } from '@/lib/theme-persistence'
import type { ThemeVariableGroup as ThemeVariableGroupType, CustomTheme, ThemePreferences } from '@/types/theme-editor'
import { ThemePresetBar } from '@/components/settings/ThemePresetBar'
import { ThemeVariableGroup } from '@/components/settings/ThemeVariableGroup'
import { ThemeSavedList } from '@/components/settings/ThemeSavedList'
import { ThemeImportModal } from '@/components/settings/ThemeImportModal'
import { ColorPickerPopover } from '@/components/settings/ColorPickerPopover'
import { ThemeLivePreview } from '@/components/settings/ThemeLivePreview'

export const Route = createFileRoute('/settings/theme')({
  component: ThemeEditorPage,
})

const GROUP_ORDER: ThemeVariableGroupType[] = ['brand', 'backgrounds', 'text', 'borders']

function ThemeEditorPage() {
  const t = useTheme()
  const { success } = useToast()

  const [editorValues, setEditorValues] = useState<Record<string, string>>(
    () => ({ ...PRESET_THEMES['dark'] })
  )
  const [themeName, setThemeName] = useState('My Custom Theme')
  const [baseTheme, setBaseTheme] = useState<'dark' | 'light'>('dark')
  const [activePreset, setActivePreset] = useState<string | null>('dark')
  const [savedThemes, setSavedThemes] = useState<Record<string, CustomTheme>>({})
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<string | null>(null)
  const pickerAnchorRef = useRef<HTMLElement | null>(null)

  // Apply editor values as CSS variables on documentElement for live preview
  useEffect(() => {
    for (const [shortKey, value] of Object.entries(editorValues)) {
      const cssVar = shortKeyToCssVar(shortKey)
      document.documentElement.style.setProperty(cssVar, value)
    }
    return () => {
      for (const shortKey of Object.keys(editorValues)) {
        const cssVar = shortKeyToCssVar(shortKey)
        document.documentElement.style.removeProperty(cssVar)
      }
    }
  }, [editorValues])

  // Load saved themes from API on mount
  useEffect(() => {
    let cancelled = false
    loadThemeFromApi()
      .then((prefs) => {
        if (cancelled || !prefs) return
        setSavedThemes(prefs.custom_themes ?? {})
        if (prefs.active_theme) {
          setActiveSavedId(prefs.active_theme)
        }
      })
      .catch(() => {
        // Silently ignore — user may not be authenticated
      })
    return () => { cancelled = true }
  }, [])

  const handleSaveTheme = useCallback(async () => {
    setSaving(true)
    try {
      // Generate an ID for the theme (reuse active if editing)
      const themeId = activeSavedId ?? crypto.randomUUID()

      // Build sparse overrides — only include values that differ from the base preset defaults
      const baseDefaults = PRESET_THEMES[baseTheme] ?? PRESET_THEMES['dark']
      const overrides: Record<string, string> = {}
      for (const [key, value] of Object.entries(editorValues)) {
        if (value !== baseDefaults[key]) {
          overrides[key] = value
        }
      }

      const customTheme: CustomTheme = {
        name: themeName,
        base: baseTheme,
        variables: overrides,
      }

      const updatedThemes = { ...savedThemes, [themeId]: customTheme }

      const prefs: ThemePreferences = {
        active_theme: themeId,
        custom_themes: updatedThemes,
      }

      await saveThemeToApi(prefs)
      setThemeCookie(editorValues)
      localStorage.setItem('remember_theme', themeId)

      setSavedThemes(updatedThemes)
      setActiveSavedId(themeId)
      success({ title: 'Theme saved' })
    } catch (err) {
      console.error('[theme-editor] save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [activeSavedId, baseTheme, editorValues, savedThemes, themeName, success])

  const handlePresetSelect = useCallback((presetName: string) => {
    const preset = PRESET_THEMES[presetName]
    if (!preset) return
    setEditorValues({ ...preset })
    setActivePreset(presetName)
    // Infer base theme from preset name
    if (presetName === 'light') {
      setBaseTheme('light')
    } else {
      setBaseTheme('dark')
    }
  }, [])

  const handleVariableChange = useCallback((shortKey: string, value: string) => {
    setEditorValues((prev) => ({ ...prev, [shortKey]: value }))
    setActivePreset(null)
  }, [])

  const handlePickerOpen = useCallback((shortKey: string, anchorEl: HTMLElement) => {
    setPickerOpen((prev) => (prev === shortKey ? null : shortKey))
    pickerAnchorRef.current = anchorEl
  }, [])

  const handlePickerClose = useCallback(() => {
    setPickerOpen(null)
    pickerAnchorRef.current = null
  }, [])

  const handlePickerChange = useCallback((color: string) => {
    if (pickerOpen) {
      setEditorValues((prev) => ({ ...prev, [pickerOpen]: color }))
      setActivePreset(null)
    }
  }, [pickerOpen])

  const handleLoadTheme = useCallback((id: string) => {
    const theme = savedThemes[id]
    if (!theme) return
    // Merge base defaults with overrides
    const baseDefaults = { ...(PRESET_THEMES[theme.base] ?? PRESET_THEMES['dark']) }
    setEditorValues({ ...baseDefaults, ...theme.variables })
    setThemeName(theme.name)
    setBaseTheme(theme.base)
    setActivePreset(null)
    setActiveSavedId(id)
  }, [savedThemes])

  const handleDeleteTheme = useCallback(async (id: string) => {
    const updated = { ...savedThemes }
    delete updated[id]
    setSavedThemes(updated)

    // If deleting the active theme, clear the selection
    if (activeSavedId === id) {
      setActiveSavedId(null)
    }

    // Persist the deletion
    try {
      const prefs: ThemePreferences = {
        active_theme: activeSavedId === id ? '' : (activeSavedId ?? ''),
        custom_themes: updated,
      }
      await saveThemeToApi(prefs)
    } catch (err) {
      console.error('[theme-editor] delete failed:', err)
    }
  }, [savedThemes, activeSavedId])

  const handleExport = useCallback(async () => {
    const yaml = exportThemeYaml(themeName, baseTheme, editorValues)
    await navigator.clipboard.writeText(yaml)
    success({ title: 'Theme YAML copied to clipboard' })
  }, [themeName, baseTheme, editorValues, success])

  const handleImport = useCallback((name: string, base: 'dark' | 'light', variables: Record<string, string>) => {
    setThemeName(name)
    setBaseTheme(base)
    const baseDefaults = { ...(PRESET_THEMES[base] ?? PRESET_THEMES['dark']) }
    setEditorValues({ ...baseDefaults, ...variables })
    setActivePreset(null)
  }, [])

  return (
    <div className="lg:flex lg:gap-6 pb-12 px-4 lg:px-6">
      {/* Left column: Editor */}
      <div className="space-y-6 lg:flex-1 lg:min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className={`flex items-center gap-1 text-sm ${t.buttonGhost} transition-colors px-2 py-1 rounded`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
      </div>

      <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Theme Editor</h1>

      {/* Theme Name */}
      <div>
        <label className={`block text-sm ${t.textSecondary} mb-1`}>Theme Name</label>
        <input
          type="text"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg ${t.input} ${t.inputFocus}`}
        />
      </div>

      {/* Base Theme */}
      <div>
        <label className={`block text-sm ${t.textSecondary} mb-1`}>Base Theme</label>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((base) => (
            <button
              key={base}
              type="button"
              onClick={() => setBaseTheme(base)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                baseTheme === base
                  ? `${t.active} border-2 border-brand-primary text-brand-primary`
                  : `${t.buttonGhost} border-2 border-transparent`
              }`}
            >
              {base.charAt(0).toUpperCase() + base.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Bar */}
      <div>
        <label className={`block text-sm ${t.textSecondary} mb-2`}>Presets</label>
        <ThemePresetBar activePreset={activePreset} onSelect={handlePresetSelect} />
      </div>

      {/* Variable Groups */}
      <div className="space-y-4">
        {GROUP_ORDER.map((group) => (
          <ThemeVariableGroup
            key={group}
            group={group}
            variables={getVariablesByGroup(group)}
            values={editorValues}
            onChange={handleVariableChange}
            onPickerOpen={handlePickerOpen}
          />
        ))}
      </div>

      {/* Saved Themes */}
      <ThemeSavedList
        themes={savedThemes}
        activeId={activeSavedId}
        onLoad={handleLoadTheme}
        onDelete={handleDeleteTheme}
      />

      {/* Footer Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-border-default">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveTheme}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${t.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${t.buttonGhost} border border-border-default`}
        >
          Export YAML
        </button>
        <button
          type="button"
          onClick={() => setImportModalOpen(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${t.buttonGhost} border border-border-default`}
        >
          Import YAML
        </button>
      </div>

      <ThemeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />
      </div>

      {/* Right column: Live Preview (desktop only) */}
      <div className="hidden lg:block lg:w-80 lg:shrink-0">
        <div className="sticky top-6">
          <ThemeLivePreview />
        </div>
      </div>

      {/* Color Picker Popover */}
      {pickerOpen && pickerAnchorRef.current && (
        <ColorPickerPopover
          color={editorValues[pickerOpen] ?? '#000000'}
          onChange={handlePickerChange}
          anchorRef={pickerAnchorRef}
          onClose={handlePickerClose}
        />
      )}
    </div>
  )
}
