import { AdventureBoard } from './components/AdventureBoard';
import { BossBattle } from './components/BossBattle';
import { CharacterCreation } from './components/CharacterCreation';
import { Compendium } from './components/Compendium';
import { Dashboard } from './components/Dashboard';
import { Diagnostic } from './components/Diagnostic';
import { HUD } from './components/HUD';
import { ProblemView } from './components/ProblemView';
import { TitleScreen } from './components/TitleScreen';
import { UnitCircleExplorer } from './components/UnitCircleExplorer';
import { WorldMap } from './components/WorldMap';
import { useGameStore } from './store/gameStore';

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <>
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
    </>
  );
}

export default App;
