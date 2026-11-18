import { AdventureBoard } from './components/AdventureBoard';
import { BossBattle } from './components/BossBattle';
import { CharacterCreation } from './components/CharacterCreation';
import { Compendium } from './components/Compendium';
import { Dashboard } from './components/Dashboard';
import { Diagnostic } from './components/Diagnostic';
import { ExamSimulator } from './components/ExamSimulator';
import { FreePractice } from './components/FreePractice';
import { HUD } from './components/HUD';
import { ObliqueTriangleSolver } from './components/ObliqueTriangleSolver';
import { ConicSectionExplorer } from './components/ConicSectionExplorer';
import { ExponentialLogGraphExplorer } from './components/ExponentialLogGraphExplorer';
import { MatrixRowOperationSimulator } from './components/MatrixRowOperationSimulator';
import { PascalsTriangleExplorer } from './components/PascalsTriangleExplorer';
import { PolarGrapher } from './components/PolarGrapher';
import { PolynomialGraphExplorer } from './components/PolynomialGraphExplorer';
import { ProblemView } from './components/ProblemView';
import { RationalGraphExplorer } from './components/RationalGraphExplorer';
import { SequenceSeriesExplorer } from './components/SequenceSeriesExplorer';
import { TrigEquationExplorer } from './components/TrigEquationExplorer';
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
      {/* Lets keyboard users jump past the persistent nav bar (5-6 buttons on every
          screen) straight to the screen's own content, instead of re-tabbing through
          the same nav every time. Only visible once focused. */}
      {screen !== 'title' && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-black focus:font-semibold"
        >
          Skip to main content
        </a>
      )}
      {screen !== 'title' && <HUD />}
      <main id="main-content" tabIndex={-1}>
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
        {screen === 'rationalgrapher' && <RationalGraphExplorer />}
        {screen === 'polynomialgrapher' && <PolynomialGraphExplorer />}
        {screen === 'explographer' && <ExponentialLogGraphExplorer />}
        {screen === 'conicexplorer' && <ConicSectionExplorer />}
        {screen === 'trigequation' && <TrigEquationExplorer />}
        {screen === 'pascalstriangle' && <PascalsTriangleExplorer />}
        {screen === 'sequenceexplorer' && <SequenceSeriesExplorer />}
        {screen === 'matrixsimulator' && <MatrixRowOperationSimulator />}
        {screen === 'freepractice' && <FreePractice />}
        {screen === 'examsimulator' && <ExamSimulator />}
      </main>
    </>
  );
}

export default App;
