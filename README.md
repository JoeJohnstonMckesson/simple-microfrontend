# How to Turn Any React App into a Micro-Frontend

You're a dev. You've been happily building and maintaining an app for months — maybe even years. Then one fateful day, someone from management shows up to your team's daily standup with an idea to "streamline the user experience" and "converge our verticals" with a "strategic realignment."

Your eyes glaze over as the consultant wraps up. Your PM translates: "They've built a new customer portal, and they want to put our app in it."

You panic. "This app wasn't built to be deployed that way!" you think. But then — the lightbulb moment.

"We'll make it a micro-frontend."

And luckily, React already has everything you need.

---

## What Is a Micro-Frontend (MFE)?

A micro-frontend is an architectural pattern for integrating separate UI applications into one cohesive experience. It's the frontend equivalent of the microservices pattern on the backend — each piece of the UI is developed, deployed, and owned independently, then composed together at runtime.

It's worth noting: "micro-frontend" describes the _pattern_, not a specific implementation. There are many ways to achieve it — iframes, Web Components, module federation, and more. This article covers a lightweight, DIY approach using native ES module imports. If you want a deeper dive into the broader landscape of MFEs, [Martin Fowler's 2019 post](https://martinfowler.com/articles/micro-frontends.html) is still the best starting point.

---

## Pros and Cons

Before diving in, it's worth being honest about the trade-offs.

**Pros:**

- Teams can develop, test, and deploy independently.
- Shared components, like an app nav-bar or side bar, can be defined in the container. Keeping your MFEs light and nimble, while giving your users a more cohesive app experience.
- Failure in one MFE doesn't necessarily take down the whole app.
- You can mix and match tech stacks (more on that below).

**Cons:**

- Added complexity, especially around shared state and cross-app communication.
- Potential for duplicated dependencies (e.g., two copies of React being loaded).
- Harder to debug issues that span the container and an MFE.

If your app is small or your team is a single squad, MFEs may be more overhead than they're worth. But if you're in the situation described above — one team's app needs to live inside another team's product — this is a clean solution.

---

## MFE Structure

The architecture has two layers:

**The Container Application** is the shell the user actually navigates to. It handles shared concerns: authentication, navigation/routing, and any shared UI like a nav bar, sidebar, or footer.

**Micro-Frontends** are the individual UI applications rendered inside the container. This is where your actual features and business logic live. Each MFE is a separate, independently hosted application.

---

## The MFE Interface: Lifecycle Methods

For MFEs to play nicely inside a container, they need to expose a consistent interface. That interface is built around three lifecycle methods:

- **`init`** — Called when the container is ready to mount the MFE. Sets up the React root attached to a DOM element the container provides.
- **`update`** — Called to render or re-render the MFE. Also used to pass updated state down from the container.
- **`unmount`** — Called when the user navigates away. Cleans up the MFE and prevents memory leaks.

If you're using an established MFE framework (like [single-spa](https://single-spa.js.org/) or Webpack Module Federation), these will be handled for you. In our case, we're implementing them ourselves — which is simpler than it sounds.

---

## How to Actually Build It

### Assumptions

- Both the container and the MFE are React apps (Vite + React v19).
- Each app is hosted separately (different origins or paths).
- The browser supports native ES module `import`/`export`. No IE support — sorry.
- You can mix and match frameworks in a real setup; this example keeps both sides in React for simplicity.

---

### Understanding Your React App

Open your `main.jsx` (or `index.jsx`). You'll see something like this:

```javascript
const domElm = document.getElementById("root");
const root = ReactDOM.createRoot(domElm);
root.render(<App />);
```

This is doing three things: finding a DOM node, creating a React root attached to it, and rendering your app. Those three steps map directly to our three lifecycle methods.

---

## Converting the MFE

### Step 1: Enable the Vite Manifest

In your MFE's `vite.config.js`, enable the `manifest` option. This generates a `manifest.json` at build time that maps your source files to their hashed output filenames — the container will use this to find and import your MFE's entry point.

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      // Make sure your entry point is explicitly set
      input: "src/main.jsx",
    },
  },
});
```

### Step 2: Export the Lifecycle Functions

Replace the auto-bootstrapping code in your `main.jsx` with exported lifecycle functions:

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

let root;

export function init(domElement) {
  root = ReactDOM.createRoot(domElement);
}

export function update(appState = {}) {
  root.render(<App {...appState} />);
}

export function unmount() {
  root.unmount();
}
```

A couple of things to note:

- `root` is declared outside the functions so it persists across calls.
- `update` accepts an optional `appState` object, so the container can pass data (like the current user, theme, or feature flags) down to the MFE as props.
- By default this renders `<App />`, but you can swap that for any component in your app.

### Step 3: Keep Local Development Working

With the changes above, running your MFE in isolation will render a blank page — nothing is calling `init` or `update` anymore. Fix that by adding a small bootstrap script to your `index.html`:

```html
<script type="module">
  import { init, update } from "/src/main.jsx";

  const rootElement = document.getElementById("root");
  init(rootElement);
  update();
</script>
```

> **Note:** This path (`/src/main.jsx`) works when running locally via `vite dev`. After a production build, Vite will output hashed filenames — so this script is for development only. Your container will use the manifest to find the correct production path (see below).

Now you can still run and develop your MFE independently as if it were a normal React app.

---

## Setting Up the Container

In your container app, create a `MFERenderer` component. This component is responsible for fetching the MFE's assets, running its lifecycle, and keeping it in sync with the container's state.

```javascript
import React, { useRef, useEffect } from "react";

export function MFERenderer({ mfeManifestUrl, appState }) {
  const mfeRoot = useRef(null);
  const mfeModule = useRef(null);

  useEffect(() => {
    if (mfeModule.current) return; // already initialized

    const loadMFE = async () => {
      // 1. Fetch the manifest to find the hashed entry point filename
      const manifestResponse = await fetch(mfeManifestUrl);
      const manifest = await manifestResponse.json();

      // 2. The manifest key matches your Vite entry point
      const entryPath = manifest["src/main.jsx"].file;

      // 3. Dynamically import the MFE module
      const mod = await import(/* @vite-ignore */ entryPath);
      mfeModule.current = mod;

      // 4. Initialize and render
      mod.init(mfeRoot.current);
      mod.update(appState);
    };

    loadMFE();

    // Unmount when the component is removed from the DOM
    return () => mfeModule.current?.unmount();
  }, []);

  // Re-render the MFE whenever the container's state changes
  useEffect(() => {
    mfeModule.current?.update(appState);
  }, [appState]);

  return <div ref={mfeRoot} />;
}
```

A few things happening here:

- The first `useEffect` runs once on mount. It fetches the manifest, resolves the MFE's entry file path, dynamically imports the module, and calls `init` + `update`.
- The second `useEffect` runs whenever `appState` changes, keeping the MFE in sync with the container.
- The cleanup function in the first effect calls `unmount` when `MFERenderer` is removed from the DOM.

Then, drop `MFERenderer` into your container's `App.jsx`:

```javascript
import { MFERenderer } from "./MFERenderer";

export default function App() {
  const [appState] = useState({ user: currentUser, theme: "dark" });

  return (
    <main>
      <Header />
      <Sidebar />

      <MFERenderer
        mfeManifestUrl="https://your-mfe.example.com/.vite/manifest.json"
        appState={appState}
      />

      <Footer />
    </main>
  );
}
```

Run both apps, and you should see your MFE rendering inside the container.

---

## Things to Consider

This approach is quick and practical, but go in with eyes open:

**Bundle bloat.** Both the container and each MFE ship their own copy of React. That's extra kilobytes your users download before they see anything. The more MFEs you add, the worse this gets. To address it, you can configure Vite to externalize React and load it from a shared CDN, or use Webpack Module Federation which has built-in support for shared dependencies.

**Routing.** If your MFE has its own internal routes (e.g., using React Router), those can conflict with the container's router. A common pattern is to give each MFE a path prefix (`/your-app/*`) and have the container's router handle top-level navigation while passing the sub-path down to the MFE.

**Shared state.** Passing data via `appState` props works for simple cases. For more complex cross-app communication (events, shared stores), you'll want to look at a custom event bus or a shared state library that both apps can access.

Despite these caveats, this method is a solid starting point — especially if you're in the "we need this working by next quarter" situation that started this whole conversation.

**Error Handling.**
Theres nothing in this example that prevents an error in an MFE from bubbling up and taking down the container app. I recommend adding an error boundary around the MFERenderer in the container. Though teams may want to add boundaries to their MFEs.

**Shared CSS**
Ideally, your teams will have a shared CSS/Component library. This will help the overall user experience. In cases where a MFE needs its own custom css, make sure it wont conflict with the container, or other MFEs. And make sure the design of your MFE doesnt conflict with the container. No absolute positioning!
