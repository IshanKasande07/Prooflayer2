# ProofLayer System Architecture

This document provides a detailed technical overview of the ProofLayer platform architecture, data flow, and integration patterns.

![ProofLayer Application Architecture](./readme/prooflayer_architecture.png)

## 1. High-Level Architecture

ProofLayer is a serverless React application that leverages Firebase for persistence and Scrape.do for managed web scraping.

```mermaid
graph TD
    subgraph "Client Tier (React + Vite)"
        UI[User Interface]
        Scraper[Scraper Engine]
        Dist[Distribution Service]
        Auth[Auth Context]
    end

    subgraph "Infrastructure Tier"
        SD[Scrape.do API]
        FB_Auth[Firebase Auth]
        FB_FS[(Firestore DB)]
    end

    subgraph "External Sources"
        G2[G2.com]
        CP[Capterra]
        TR[TrustRadius]
    end

    UI --> Scraper
    Scraper -->|Proxy Request| SD
    SD --> G2 & CP & TR
    UI --> Auth
    Auth --> FB_Auth
    UI --> FB_FS
    Dist --> FB_FS
```

## 2. Scraping Data Flow (Sequence Diagram)

When a user initiates an import, the following sequence occurs:

```mermaid
sequenceDiagram
    participant U as User
    participant SE as Scraper Engine
    participant SD as Scrape.do
    participant EX as External Site (G2/CP)
    participant ST as Staging (Local/Firebase)

    U->>SE: Provide Product URL
    SE->>SD: Request Page HTML (with Super Proxy)
    SD->>EX: Fetch Rendered HTML
    EX-->>SD: HTML Content
    SD-->>SE: Raw HTML String
    SE->>SE: Parse DOM (Selector Fallbacks)
    SE->>ST: Save to LocalStorage & 'imported' Collection
    ST-->>U: Display for Review/Approval
```

## 3. The "Selective Sharing" Mechanism

ProofLayer uses a staging-to-live workflow to ensure only high-quality testimonials are displayed publicly.

1.  **Staging (`imported` common)**: Raw reviews fetched from the web.
2.  **Dashboard (`testimonials` collection)**: Approved reviews.
3.  **API Distribution (`isDistributed: true`)**: A flag in the `testimonials` collection that determines if a review is exposed via the public REST Endpoint or Widget.

## 4. Technical Stack Details

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (Vite) | Core App Shell |
| **Authentication** | Firebase Auth | User identity and RBAC |
| **Database** | Cloud Firestore | Persistent storage for reviews |
| **Scraping Proxy** | Scrape.do | Residential IP rotation & JS Rendering |
| **Storage** | Browser LocalStorage | Local caching for "Zero-Loss" imports |
| **Styling** | Vanilla CSS + Tailwind | Premium Responsive UI |

## 5. Security & RBAC

*   **Security Rules**: Firestore rules restrict `testimonials` deletion to specific roles (Admin/Moderator).
*   **Scraping Tokens**: The Scrape.do token is kept in utility files (should move to `.env` for production).
*   **Data Integrity**: Source URLs and `importedAt` timestamps are strictly maintained to track data provenance.
