# Project Brief: Emulsion

Emulsion is a web-based film roll inventory management system designed to track analog film rolls through their entire lifecycle: from purchase → loading → shooting → developing → scanning.

## Core Goals
1. **Lifecycle Tracking**: Monitor rolls through 5 standard stages (New, Loaded, Exposed, Developed, Scanned).
2. **Chemistry Management**: Track chemistry batches (C41, B&W), calculate usage/exhaustion, and automate development cost tracking.
3. **Data Insights**: Provide statistics on spending, shooting habits, film stock preferences, and costs per shot.
4. **Mobile-First Experience**: Enable usage on the go (while loading/unloading camera) via a responsive web interface.

## Project Scope
- **User**: Single user (self-hosted).
- **Platform**: Web application (SPA + REST API) optimized for local network access.
- **Data Model**: Relational (Rolls, Chemistry, and their associations).
- **Deployment**: Local network server (e.g., Raspberry Pi or local machine).

## Key Features
- **Kanban Board**: Drag-and-drop interface for managing roll status.
- **Computed Status**: Status is derived from data presence (dates, chemistry, ratings), not a hard-coded state.
- **Cost Calculations**: Automatic calculation of total cost and cost-per-shot based on film price and chemistry efficiency.
- **Chemistry Timer**: (Planned) Tools to assist in the development process.
- **Statistics**: Visual analytics for financial and artistic patterns.
