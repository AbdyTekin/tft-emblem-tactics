# Team Solver Logic Documentation

## Overview
The Team Solver is the core engine of TFT Emblem Tactics. It generates optimal team compositions based on the user's available champions, active emblems, player level, and selected strategy.

## Core Components
*   **[lib/solver.ts](file:///c:/Users/Abdy/Documents/GitHub/tft-emblem-tactics/lib/solver.ts)**: Contains the main logic (`solveTeamComp`), scoring (`calculateDifficulty`), and combination generation (`getCombinations`).
*   **[lib/trait-rules.ts](file:///c:/Users/Abdy/Documents/GitHub/tft-emblem-tactics/lib/trait-rules.ts)**: Defines the rules for every trait, including breakpoints, trait types (Origin, Class, Region), and emblem availability.
*   **[components/TeamRecommendations.tsx](file:///c:/Users/Abdy/Documents/GitHub/tft-emblem-tactics/components/TeamRecommendations.tsx)**: The UI component that displays the generated teams, showing active synergies and scores.

## Algorithm Breakdown

The solving process consists of four main steps:

### 1. Smart Pool Selection (Filtering)
Calculating combinations for all available champions (60+) is computationally impossible for a web browser (60 choose 9 ≈ 14 billion combinations). To solve this, the algorithm first selects a "candidate pool" of the **20 most relevant champions**.

Relevance is calculated using a heuristic score:
*   **Base Score**: Champion Cost × 1.5 (High cost units are stronger).
*   **Synergy Bonus**: +10 if the champion activates an emblem the user has.
*   **Strategy Bonus (RegionRyze)**:
    *   +20 if the champion has a Region trait.
    *   +30 if the champion activates a Region trait for which the user *also* has an emblem.
*   **Strategy Bonus (BronzeLife)**:
    *   +10 per trait the champion owns (flexibility).
    *   +20 if the champion matches an active emblem.

### 2. Combination Generation (Recursion)
From the filtered pool of ~20 champions, the algorithm generates all valid team compositions for the user's specific level.

*   **Recursion**: Uses a Depth-First Search (DFS) to generate unique combinations.
*   **Dynamic Pool Sizing**: To ensure the UI remains responsive (< 200ms execution time), the pool size is dynamically adjusted based on the player level.
    *   Level ≤ 8: Pool size 20.
    *   Level > 8: Pool size 18 (Restricts combinations to ~50k).
*   **Safety Cap**: Hard limit of 50,000 combinations to prevent browser crashes.

### 3. Scoring & Strategies
Each generated team is assigned a "Difficulty" score and a specific strategy metric.

#### Scoring Formula
`Difficulty = Total Team Cost + (Sum of Active Trait Tiers × 5)`

#### Strategies
1.  **Region Ryze (`RegionRyze`)**:
    *   **Goal**: Maximize unique active **Region** traits.
    *   **Bonus**: `Difficulty += Active Regions × 1000`
    *   **Why**: Forces the sorter to maximize Regions above all else.

2.  **Bronze for Life (`BronzeLife`)**:
    *   **Goal**: Maximize unique **Bronze-tier** traits (Traits with their first level active).
    *   **Bonus**: `Difficulty += Active Bronze Traits × 1000`
    *   **Constraint**: Excludes "Targon" (user rule). Only counts Region and Class traits.

### 4. Ranking & Selection
The list of valid teams is sorted based on the calculated Difficulty/Strategy score. The top **20** teams are returned to the user interface.
