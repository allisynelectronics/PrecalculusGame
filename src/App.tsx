import { AdventureBoard } from './components/AdventureBoard';
import { BossBattle } from './components/BossBattle';
import { CharacterCreation } from './components/CharacterCreation';
import { Compendium } from './components/Compendium';
import { Dashboard } from './components/Dashboard';
import { Diagnostic } from './components/Diagnostic';
import { HUD } from './components/HUD';
import { ObliqueTriangleSolver } from './components/ObliqueTriangleSolver';
import { PolarGrapher } from './components/PolarGrapher';
import { ProblemView } from './components/ProblemView';
import { SaveRecoveryBanner } from './components/SaveRecoveryBanner';
import { TitleScreen } from './components/TitleScreen';
import { TrigWaveVisualizer } from './components/TrigWaveVisualizer';
import { UnitCircleExplorer } from './components/UnitCircleExplorer';
import { VectorSimulator } from './components/VectorSimulator';
import { WorldMap } from './components/WorldMap';
import { useGameStore } from './store/gameStore';

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <>
      <SaveRecoveryBanner />
      {screen !== 'title' && <HUD />}
      {screen === 'title' && <TitleScreen />}
      {screen === 'character' && <CharacterCreation />}
      {screen === 'diagnostic' && <Diagnostic />}
      {screen === 'worldmap' && <WorldMap />}
      {screen === 'board' && <AdventureBoard />}
      {screen === 'problem' && <ProblemView />}
      {screen === 'boss' && <BossBattle />}
      {screen === 'dashboard' && <Dashboard />}
      {screen === 'compendium' && <Compendium />}
      {screen === 'unitcircle' && <UnitCircleExplorer />}
      {screen === 'trigwave' && <TrigWaveVisualizer />}
      {screen === 'obliquetriangle' && <ObliqueTriangleSolver />}
      {screen === 'vectorlab' && <VectorSimulator />}
      {screen === 'polargrapher' && <PolarGrapher />}
    </>
  );
}

export default App;
