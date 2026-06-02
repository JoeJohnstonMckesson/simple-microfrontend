import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

let root

export function init(domElement) {
  root = ReactDOM.createRoot(domElement)
}

export function update(appState = {}) {
  root.render(<App {...appState} />)
}

export function unmount() {
  root.unmount()
}
