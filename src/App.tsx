import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
              DomainVault Marketplace
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Welcome to the premium domain marketplace - Testing Mode
            </p>
            <div className="text-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;