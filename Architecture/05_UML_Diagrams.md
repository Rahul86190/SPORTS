# 5. UML Diagrams

This document contains Mermaid-based UML representations outlining the application architecture and primary workflows.

## 1. System Components Diagram (Architecture)
This outlines high-level technical components interacting across the stack.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Next.js Web App]
        UI[User Interface]
        AuthC[Auth Context]
        DashC[Dashboard Components]
        MapC[Roadmap Renderer]
        
        UI --> AuthC
        UI --> DashC
        DashC --> MapC
    end

    %% Backend Layer
    subgraph Backend [FastAPI Server]
        API[Main API Gateway]
        RouterAuth[Authentication]
        RouterRM[Roadmap Engine]
        RouterOpp[Opportunities Service]
        LLM[GenAI Parser/Adapter]
        Scrapers[Web Scrapers]
        
        API --> RouterAuth
        API --> RouterRM
        API --> RouterOpp
        RouterRM --> LLM
    end

    %% Storage Layer
    subgraph Database [Supabase PostgreSQL]
        DBProfiles[(Profiles Table)]
        DBJobs[(Jobs / Events Table)]
        AuthStorage[(Supabase Auth)]
    end
    
    %% External Services
    subgraph External [External APIs]
        Gemini[Google Gemini API]
        ExternalJobs[Devpost / Job Boards]
    end

    %% Connections
    Frontend -->|REST| API
    Frontend -->|Direct Auth Init| AuthStorage
    API --> DBProfiles
    RouterOpp --> DBJobs
    Scrapers --> DBJobs
    Scrapers -->|HTML Scraping| ExternalJobs
    LLM --> Gemini
```

## 2. Sequence Diagram: Roadmap Generation Loop

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant FastAPI
    participant LLM_Adapter
    participant Supabase

    User->>Frontend: Requests Career Path (e.g. AI Engineer)
    Frontend->>FastAPI: POST /api/roadmap/generate
    FastAPI->>Supabase: Fetch user profile & skills
    Supabase-->>FastAPI: Returns active skills state
    FastAPI->>LLM_Adapter: Request path (Target: AI Engineer, Current: Skills)
    LLM_Adapter->>Gemini API: Construct dynamic prompt & invoke
    Gemini API-->>LLM_Adapter: Returns JSON node map (Retrospective & Predictive)
    LLM_Adapter-->>FastAPI: Validates & formats JSON tree
    FastAPI->>Supabase: Save latest roadmap state
    FastAPI-->>Frontend: Return roadmap tree geometry
    Frontend-->>User: Visualizes active Roadmap Nodes
```

## 3. Use Case Diagram

```mermaid
usecaseDiagram
    actor Student
    actor System as "Automated Scraper"
    
    usecase "Login / Onboard" as UC1
    usecase "View Profile Vault" as UC2
    usecase "Generate Career Path" as UC3
    usecase "Take Adaptive Test" as UC4
    usecase "View Tailored Resume" as UC5
    usecase "View Job Matches" as UC6
    
    usecase "Update Opportunities" as UC7
    
    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    
    System --> UC7
```
