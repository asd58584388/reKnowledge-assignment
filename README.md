# Earthquake Data Visualization Dashboard

An interactive web application for visualizing and exploring earthquake data from the USGS (United States Geological Survey). The dashboard provides real-time earthquake information with interactive charts, data tables, and error uncertainty displays.

## ✨ Features

### 📊 Interactive Data Visualization
- **Scatter Plot Chart**: Interactive scatter chart with configurable X/Y axes
- **Smart Downsampling**: Automatic clustering for performance with zoom-to-explore functionality
- **Bi-directional Selection**: Click chart points to highlight table rows, and vice versa
- **Auto-scroll Synchronization**: Chart selections automatically scroll to corresponding table rows

### 📋 Advanced Data Table
- **Error Display**: Shows measurement uncertainties (magnitude ± error, depth ± error, etc.)
- **Virtualized Rendering**: High-performance rendering for large datasets
- **Column Sorting**: Sort by any column with visual indicators
- **Real-time Highlighting**: Context-aware row highlighting based on chart interactions

### 🎯 Smart Data Management
- **Perfect Synchronization**: Chart and table always show identical data
- **Coordinate Validation**: Automatic filtering of invalid data points
- **Data Stats**: Real-time count and statistics display
- **Caching & Performance**: Optimized data processing with intelligent caching

### 🔧 Technical Features
- **Zustand State Management**: Optimized global state with selective subscriptions
- **React Query**: Intelligent data fetching with caching and retry logic
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **TailwindCSS 4** - Utility-first CSS framework
- **Recharts** - Declarative chart library for React
- **TanStack React Table** - Powerful table component with virtualization
- **TanStack React Virtual** - Virtualized scrolling for performance
- **TanStack React Query** - Data fetching and caching
- **Zustand 5** - Lightweight state management

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reknowledge-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/
│   ├── chart/
│   │   └── EarthquakeChart.tsx    # Interactive scatter plot with clustering
│   ├── table/
│   │   └── EarthquakeTable.tsx    # Virtualized data table with error display
│   ├── common/
│   │   ├── LoadingSpinner.tsx     # Loading indicator
│   │   └── ErrorMessage.tsx       # Error display
│   └── Dashboard.tsx              # Main layout component
├── contexts/
│   └── EarthquakeContext.tsx      # React Context for selection state
├── stores/
│   └── earthquakeStore.ts         # Zustand global store
├── hooks/
│   └── useEarthquakeData.ts       # React Query data fetching
├── utils/
│   └── dataProcessing.ts          # Data parsing and enhancement utilities
├── types/
│   └── earthquake.ts              # TypeScript interfaces
└── App.tsx                        # Root component with providers
```

## 📊 Data Source

The application fetches live earthquake data from:
- **Source**: USGS Earthquake Hazards Program
- **URL**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv
- **Update Frequency**: Real-time (updated as new earthquakes are detected)
- **Coverage**: Global earthquake activity from the past month

## 🎨 Key Components

### EarthquakeChart
- Interactive scatter plot with configurable axes
- Smart clustering with zoom functionality
- Real-time selection synchronization
- Performance-optimized rendering

### EarthquakeTable
- Virtualized table supporting thousands of rows
- Error uncertainty display (±values)
- Auto-scroll to selected items
- Sortable columns with persistence

### Dashboard
- Orchestrates data flow between components
- Handles data synchronization
- Manages loading and error states

## 🚀 Performance Optimizations

- **Virtualized Rendering**: Only renders visible table rows
- **Smart Clustering**: Reduces chart complexity for large datasets
- **Zustand Selectors**: Prevents unnecessary re-renders
- **Data Caching**: Intelligent caching of processed data
- **Memoization**: Strategic use of React.memo and useMemo

## 🔮 Future Enhancements

- Real-time data updates via WebSocket
- Advanced filtering and search capabilities
- Export functionality (CSV, JSON)
- Earthquake prediction models integration
- Historical data analysis tools
- Mobile-optimized touch interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- USGS for providing real-time earthquake data
- React and TypeScript communities for excellent tooling
- TanStack team for powerful data management libraries
