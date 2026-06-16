# Rev.AI 🚀

![Rev.AI Banner](https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200&h=400)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

**Rev.AI** is an intelligent guest review analysis platform designed for homestays and hotels. It leverages mock AI logic (ready for Gemini API integration) to transform raw guest feedback into actionable insights, sentiment classification, and professional management responses.

---

## 🌟 Key Features

- **🔍 Intelligent Analysis**: Automatically classifies reviews into *Positive*, *Neutral*, or *Negative* sentiments.
- **🏷️ Theme Detection**: Categorizes feedback into key areas: *Food, Host, Location, Cleanliness, Value, or Experience*.
- **✍️ AI-Powered Responses**: Generates tailored, professional management responses based on the review's tone and theme.
- **📊 Interactive Dashboard**: Visualizes feedback trends using dynamic charts (Doughnut & Bar) powered by Chart.js.
- **⚡ Batch Processing**: Analyze multiple reviews simultaneously by pasting them in a list format.
- **💾 Persistent History**: Automatically saves analysis results to local storage for future reference.
- **📥 CSV Export**: Download analysis data in CSV format for further reporting.

---

## 📸 App Preview

> **Note**: Add your own screenshots here to showcase the UI.

| Dashboard View | Analysis Results |
| :---: | :---: |
| ![Dashboard Placeholder](https://placehold.co/600x400/20232a/61dafb?text=Dashboard+View) | ![Results Placeholder](https://placehold.co/600x400/646cff/ffffff?text=Analysis+Results) |

---

## 🏗️ System Architecture

### Component Interaction
The following diagram illustrates the high-level architecture and data flow:

```mermaid
graph TD
    subgraph Client_Side [Frontend - React]
        UI[UI Components]
        Context[Theme Context]
        Router[React Router]
    end

    subgraph Logic_Layer [Service Layer - api.js]
        Engine[Analysis Engine]
        Storage[Local Storage Wrapper]
    end

    subgraph Data_Models [Core Analysis Logic]
        Sent[Sentiment Classifier]
        Theme[Theme Detector]
        Gen[Response Generator]
    end

    User((User)) --> UI
    UI <--> Context
    UI --> Router
    UI -- "1. Submit Reviews" --> Engine
    Engine -- "2. Classify" --> Sent
    Engine -- "3. Detect" --> Theme
    Sent & Theme -- "4. Results" --> Gen
    Gen -- "5. Final Object" --> Engine
    Engine -- "6. Return Data" --> UI
    Engine -- "7. Persist" --> Storage
    Storage <--> LocalStorage[(Browser Storage)]
```

### Analysis Sequence
Detailed interaction when a user triggers the analysis:

```mermaid
sequenceDiagram
    participant U as User
    participant V as View (ReviewForm)
    participant A as API Service (api.js)
    participant E as Analysis Engine
    participant S as LocalStorage

    U->>V: Paste Reviews & Click Analyze
    V->>A: analyzeReviews(textArray)
    Note over A: Artificial Delay (Simulate API)
    loop For each review
        A->>E: analyzeReview(text)
        E->>E: classifySentiment()
        E->>E: detectTheme()
        E->>E: generateResponse()
        E-->>A: Result Object
    end
    A-->>V: Return All Results
    V->>A: saveToHistory(results)
    A->>S: Update 'revai_history'
    V->>U: Display Results Table
```

---

## 🔄 Logic Flow

Detailed decision-making process for the mock AI engine:

```mermaid
flowchart TD
    Start([Start Analysis]) --> Clean[Trim & Filter Empty Lines]
    Clean --> Loop{For Each Line}
    
    Loop --> Sent[Sentiment Analysis]
    Sent --> S_Score[Match Keywords: Positive vs Negative]
    S_Score --> S_Calc{Ratio > 0.65?}
    S_Calc -- Yes --> Pos[Positive]
    S_Calc -- No --> S_Calc2{Ratio < 0.35?}
    S_Calc2 -- Yes --> Neg[Negative]
    S_Calc2 -- No --> Neu[Neutral]

    Loop --> Theme[Theme Detection]
    Theme --> T_Score[Count Keyword Matches per Category]
    T_Score --> T_Max{Highest Score?}
    T_Max -- Found --> T_Set[Set Theme]
    T_Max -- None --> T_Def[Default: Experience]

    Pos & Neg & Neu --> Resp[Response Generation]
    T_Set & T_Def --> Resp
    
    Resp --> Template[Select Random Template from Matrix]
    Template --> Final[Build Analysis Object]
    Final --> Loop
    
    Loop -- Done --> End([Return Collection])
```

---

## 🔄 User Workflow
A streamlined process to go from raw text to professional management:

```mermaid
flowchart LR
    A[Input Reviews] --> B{Analyze}
    B --> C[Sentiment Scoring]
    B --> D[Theme Mapping]
    C & D --> E[Generate Suggestions]
    E --> F[Review Results]
    F --> G[Export / Save]
    F --> H[Visualize Dashboard]
```

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite 8](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) with [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: Modern CSS3 (Custom Variables & Animations)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/rev-ai.git
   cd rev-ai/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```text
src/
├── components/   # Reusable UI components (Dashboard, Forms, Navbar)
├── context/      # Global state (ThemeContext)
├── pages/        # Main application pages (Home, History)
├── services/     # Core logic (Mock AI Engine, Storage Utilities)
├── App.jsx       # Routing and layout
└── main.jsx      # Entry point
```

---

## 🔮 Future Roadmap

- [ ] **Real AI Integration**: Connect to Google Gemini API for advanced NLP.
- [ ] **Multi-Language Support**: Support for analysis in various languages.
- [ ] **Advanced Analytics**: Deeper correlation charts and trend analysis over time.
- [ ] **Authentication**: User accounts and cloud-based history sync.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for better guest experiences.*
