# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo music listeners managing a personal music library.

## Product Purpose

Deplayer is a local-first unified music player for listening to and organizing a personal music library across supported sources. Success means listeners can access and enjoy their music from one responsive, offline-capable web application.

## Positioning

Deplayer combines local-first ownership with a unified player experience across supported music sources, rather than making the listener manage separate playback surfaces.

## Operating Context

Listeners use deplayer as a progressive web application on desktop and mobile browsers. The application supports local media and configured remote providers, with playback and library workflows presented through one interface.

## Capabilities and Constraints

- React, TypeScript, Vite, Redux-Saga, and LiveStore are existing implementation foundations.
- The application is deployed as a Cloudflare Pages web app.
- Offline/PWA behavior is a product constraint.
- The product must remain provider-agnostic and open-source in its implementation direction.
- Responsive behavior must support phone and desktop use.
- The current player includes ambient and panel-based Butterchurn visualizer modes.

## Brand Commitments

- Product name: deplayer.
- Open-source identity.
- Provider-agnostic terminology and workflows.

## Evidence on Hand

- Existing deplayer application and deployed web experience.
- Existing local media, remote-provider, collection, queue, playback, and settings workflows in the repository.
- Existing PWA/service-worker implementation.

## Product Principles

- Keep the listener in control of their library and playback.
- Unify supported music sources without vendor-specific assumptions.
- Preserve reliable offline-capable access where the platform allows it.
- Make listening workflows responsive and usable across phone and desktop contexts.
- Prefer clear, accessible controls over decorative complexity.

## Accessibility & Inclusion

The interface must preserve responsive use, keyboard access, and reduced-motion alternatives as the product evolves.
