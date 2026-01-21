# TFT Emblem Tactics

A tool designed to help Teamfight Tactics players optimize their compositions based on collected emblems.

[**Live Demo**](https://tft-emblem-tactics.vercel.app/)

## 🚀 Features

- **Smart Team Solver**: Automatically calculates the best team compositions based on your available champions and emblems.
- **Emblem Selector**: Easily add and remove emblems to see how they affect your potential synergies.
- **Strategy Modes**: Choose between different solver strategies ('RegionRyze', 'BronzeLife') to tailor recommendations to your playstyle.
- **Level Optimization**: Adjust player level (6-10) to discover optimal boards for different stages of the game.
- **Multi-language Support**: Built-in architecture for supporting multiple languages.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Library**: React 19

## 🏃‍♂️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- **`app/`**: Contains the Next.js App Router pages and layouts.
- **`components/`**: Reusable UI components such as the Solver controls, Trait list, and Team recommendations.
- **`lib/`**: Core utility functions, including the team solver algorithm (`solver.ts`) and trait rules (`trait-rules.ts`).
- **`context/`**: React Context providers, such as the `LanguageProvider` for managing app-wide state.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ✨ Acknowledgements

This project was developed in **Antigravity** with the help of **Vibe Coding**.
