import { useRef, useEffect } from 'react'

export function MFERenderer({ mfeManifestUrl, appState }) {
  const mfeRoot = useRef(null)
  const mfeModule = useRef(null)

  useEffect(() => {
    if (mfeModule.current) return

    const loadMFE = async () => {
      const manifestResponse = await fetch(mfeManifestUrl)
      const manifest = await manifestResponse.json()

      const baseUrl = new URL(mfeManifestUrl).origin

      // Inject MFE stylesheets
      for (const entry of Object.values(manifest)) {
        if (entry.file?.endsWith('.css')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = `${baseUrl}/${entry.file}`
          document.head.appendChild(link)
        }
      }

      const entryPath = manifest['src/main.jsx'].file
      const entryUrl = `${baseUrl}/${entryPath}`

      const mod = await import(/* @vite-ignore */ entryUrl)
      mfeModule.current = mod

      mod.init(mfeRoot.current)
      mod.update(appState)
    }

    loadMFE()

    return () => mfeModule.current?.unmount()
  }, [])

  useEffect(() => {
    mfeModule.current?.update(appState)
  }, [appState])

  return <div ref={mfeRoot} />
}
