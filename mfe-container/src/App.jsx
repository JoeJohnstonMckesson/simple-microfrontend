import { useState } from 'react'
import { MFERenderer } from './MFERenderer'
import './App.css'

const MFE_MANIFEST_URL = 'http://localhost:4173/.vite/manifest.json'

export default function App() {
  const [user] = useState({ name: 'Jane Doe', role: 'admin' })

  return (
    <div className="shell">
      <header className="shell-header">
        <span className="shell-logo">MyApp</span>
        <nav className="shell-nav">
          <a href="#">Dashboard</a>
          <a href="#" className="active">Content</a>
          <a href="#">Settings</a>
        </nav>
        <div className="shell-user">{user.name}</div>
      </header>

      <main className="shell-main">
        <MFERenderer mfeManifestUrl={MFE_MANIFEST_URL} appState={{ user }} />
      </main>
    </div>
  )
}
