# Roxodeal Admin

Independent Next.js application. All components, styles, data, assets and configuration belong to this folder. No imports from another frontend.

```powershell
cd admin
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3002. Set the other frontend origins using `.env.local` (see `.env.example`) before building for deployment. This remains a design preview with local browser state; backend integration is pending. Different origins have separate preview state.

Roxodeal branding uses this application's own logo, favicon, factory photograph and navy/gold panel stylesheet. Publish the complete folder to include components and styles, not just image assets.
