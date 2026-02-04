import './App.css';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8"> Snake Game </h1>
      <GameCanvas />
    </div>
  );
}

export default App;
