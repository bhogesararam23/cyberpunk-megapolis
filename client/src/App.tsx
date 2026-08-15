// Aerial Transit Noir — the application surface contains exactly one living game experience.
import ErrorBoundary from "./components/ErrorBoundary";
import GameCanvas from "./components/GameCanvas";

export default function App() {
  return <ErrorBoundary><GameCanvas /></ErrorBoundary>;
}
