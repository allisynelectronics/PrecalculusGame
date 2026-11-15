import { useMemo, useRef, useState } from 'react';
import { buildBoardForWorld } from '../data/board';
import { getProblemsByTopic } from '../data/problems';
import { getTopic } from '../data/topics';
import { WORLDS } from '../data/worlds';
import { useGameStore } from '../store/gameStore';
import type { BoardSpace, Screen, SpaceType } from '../types';
import { MathText } from './Math';

// Interactive labs, keyed by the world whose board should offer a shortcut to them.
const WORLD_LABS: Partial<Record<string, { screen: Screen; icon: string; label: string }[]>> = {
  'trig-kingdom': [{ screen: 'unitcircle', icon: '🔵', label: 'Unit Circle Lab' }],
  'rational-rift': [{ screen: 'rationalgrapher', icon: '📉', label: 'Rational Grapher' }],
  'polynomial-peaks': [{ screen: 'polynomialgrapher', icon: '📈', label: 'Polynomial Grapher' }],
  'exponential-empire': [{ screen: 'explographer', icon: '🏙️', label: 'Exp/Log Grapher' }],
  'conic-constellation': [{ screen: 'conicexplorer', icon: '🔭', label: 'Conic Explorer' }],
  'wave-galaxy': [{ screen: 'trigwave', icon: '🌊', label: 'Wave Visualizer' }],
  'triangle-expedition': [{ screen: 'obliquetriangle', icon: '📐', label: 'Triangle Solver' }],
  'polar-vector-valley': [
    { screen: 'vectorlab', icon: '➡️', label: 'Vector Lab' },
    { screen: 'polargrapher', icon: '🌀', label: 'Polar Grapher' },
  ],
};

const SPACE_ICON: Record<SpaceType, string> = {
  start: '🚪',
  challenge: '⚔️',
  treasure: '💰',
  shrine: '⛩️',
  portal: '🌀',
  mystery: '❓',
  training: '🏋️',
  knowledge: '🧠',
  boss: '👹',
};

const SPACE_LABEL: Record<SpaceType, string> = {
  start: 'Start',
  challenge: 'Challenge',
  treasure: 'Treasure',
  shrine: 'Formula Shrine',
  portal: 'Portal',
  mystery: 'Mystery',
  training: 'Training',
  knowledge: 'Knowledge Trial',
  boss: 'Boss Gate',
};

export function AdventureBoard() {
  const {
    currentWorldId,
    boardPositions,
    movePlayer,
    character,
    startProblem,
    markTopicSeen,
    grantReward,
    setScreen,
  } = useGameStore();
  const [rolling, setRolling] = useState(false);
  const [rollValue, setRollValue] = useState<number | null>(null);
  const [modal, setModal] = useState<{ kind: 'shrine' | 'mystery'; space: BoardSpace } | null>(null);
  const [mysteryResult, setMysteryResult] = useState<string | null>(null);
  // Guards a shrine/mystery modal's reward-granting action against a rapid double-click
  // firing it twice before the modal actually closes — reset whenever a new modal opens.
  const modalResolvedRef = useRef(false);

  const world = WORLDS.find((w) => w.id === currentWorldId)!;
  const board = useMemo(() => buildBoardForWorld(currentWorldId), [currentWorldId]);
  const boardPosition = boardPositions[currentWorldId] ?? 0;

  const lastIndex = board.length - 1;
  const clampedPos = Math.min(boardPosition, lastIndex);

  const resolveSpace = (space: BoardSpace) => {
    if (space.type === 'boss') {
      setScreen('boss');
      return;
    }
    if (space.type === 'shrine') {
      modalResolvedRef.current = false;
      setModal({ kind: 'shrine', space });
      return;
    }
    if (space.type === 'mystery') {
      modalResolvedRef.current = false;
      setModal({ kind: 'mystery', space });
      return;
    }
    if (space.topicId) {
      startProblem(space.topicId, 'board', space.type);
    }
  };

  const handleRoll = () => {
    if (rolling || clampedPos >= lastIndex) return;
    setRolling(true);
    const roll = 1 + Math.floor(Math.random() * 6);
    setRollValue(roll);
    setTimeout(() => {
      const target = Math.min(boardPosition + roll, lastIndex);
      const spaces = target - boardPosition;
      movePlayer(spaces);
      // Keep the Roll button disabled until the space actually resolves, so a quick
      // double-click can't queue a second roll while this one's landing is still pending.
      setTimeout(() => {
        setRolling(false);
        resolveSpace(board[target]);
      }, 300);
    }, 650);
  };

  const closeMystery = (bonus: boolean) => {
    if (modalResolvedRef.current) return;
    modalResolvedRef.current = true;
    if (bonus) {
      grantReward(10, 15, 0);
      setMysteryResult('You found a stash of 15 coins and 10 XP!');
    } else if (modal?.space.topicId) {
      startProblem(modal.space.topicId, 'board', 'mystery');
      setModal(null);
      return;
    }
    setTimeout(() => {
      setMysteryResult(null);
      setModal(null);
    }, 1400);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 bg-gradient-to-b from-[#1a1033] via-[#2a1a40] to-[#0b0a14]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h1 className="font-display text-2xl text-amber-200">{world.name}</h1>
          <div className="flex items-center gap-2">
            {(WORLD_LABS[currentWorldId] ?? []).map((lab) => (
              <button
                key={lab.screen}
                onClick={() => setScreen(lab.screen)}
                className="px-4 py-2 rounded-full border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/20 text-sm font-semibold"
              >
                {lab.icon} {lab.label}
              </button>
            ))}
            <button
              onClick={handleRoll}
              disabled={rolling || clampedPos >= lastIndex}
              className={`px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold shadow disabled:opacity-40 ${rolling ? 'animate-dice' : ''}`}
            >
              🎲 {rollValue ?? 'Roll'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {board.map((space) => {
            const topic = space.topicId ? getTopic(space.topicId) : undefined;
            const isHere = space.index === clampedPos;
            return (
              <div
                key={space.index}
                className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center text-center p-1 ${
                  isHere ? 'border-amber-300 bg-amber-500/20' : 'border-purple-500/30 bg-black/30'
                }`}
                title={topic?.name ?? SPACE_LABEL[space.type]}
              >
                <span className="text-xl">{SPACE_ICON[space.type]}</span>
                {isHere && character && <span className="absolute -top-2 -right-1 text-lg">{character.avatar}</span>}
                <span className="text-[9px] text-purple-300 leading-tight mt-0.5">
                  {topic ? topic.name.split(' ')[0] : SPACE_LABEL[space.type]}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-purple-400 text-sm mt-6">
          Space {clampedPos + 1} of {board.length} — roll the die to advance, solve challenges to earn XP, and
          reach {world.boss}'s Boss Gate.
        </p>
      </div>

      {modal?.kind === 'shrine' && modal.space.topicId && (
        <ShrineModal
          topicId={modal.space.topicId}
          onClose={() => {
            if (modalResolvedRef.current) return;
            modalResolvedRef.current = true;
            markTopicSeen(modal.space.topicId!);
            grantReward(5, 0, 1);
            setModal(null);
          }}
        />
      )}

      {modal?.kind === 'mystery' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-[#1a1033] border border-purple-400/40 rounded-2xl p-6 max-w-sm text-center">
            <div className="text-4xl mb-2">❓</div>
            <h2 className="font-display text-xl text-amber-200 mb-2">A Mystery Stirs...</h2>
            {mysteryResult ? (
              <p className="text-emerald-300">{mysteryResult}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-purple-300 text-sm">Choose your fate.</p>
                <button
                  onClick={() => closeMystery(true)}
                  className="w-full px-4 py-2 rounded-lg bg-amber-500/80 text-black font-semibold hover:bg-amber-400"
                >
                  🪙 Search for treasure
                </button>
                <button
                  onClick={() => closeMystery(false)}
                  className="w-full px-4 py-2 rounded-lg bg-fuchsia-500/80 text-black font-semibold hover:bg-fuchsia-400"
                >
                  ⚔️ Face a surprise challenge
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ShrineModal({ topicId, onClose }: { topicId: string; onClose: () => void }) {
  const topic = getTopic(topicId);
  const example = getProblemsByTopic(topicId).find((p) => p.worked) ?? getProblemsByTopic(topicId)[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1a1033] border border-amber-400/40 rounded-2xl p-6 max-w-lg w-full parchment-scroll max-h-[80vh] overflow-y-auto">
        <div className="text-4xl mb-2 text-center">⛩️</div>
        <h2 className="font-display text-xl text-amber-200 mb-1 text-center">{topic?.name}</h2>
        <p className="text-purple-300 text-sm mb-4 text-center">{topic?.description}</p>

        {example && (
          <div className="bg-black/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-purple-400 uppercase mb-2">Worked Example</p>
            <p className="text-purple-100 mb-2"><MathText text={example.prompt} /></p>
            <div className="space-y-1 text-sm text-amber-100">
              {(example.worked ?? example.steps ?? []).map((line, i) => (
                <div key={i}><MathText text={line} /></div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-black font-bold"
        >
          I understand — continue (+5 XP, +1 ⭐)
        </button>
      </div>
    </div>
  );
}
