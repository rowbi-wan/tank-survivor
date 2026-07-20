# Tank Survivors

Candy/bubble-themed arena survival in the Vampire Survivors vein: last as long as you can against escalating swarms, then spend scrap between runs on a branching cannon tree.

Unlike classic auto-shooters, you aim the turret yourself. The tank stays centered on screen while the world scrolls. There’s no win screen—runs end when you get popped. Longer survival and more kills mean more scrap and milestones that unlock deeper weapon options.

## Play

```bash
npm start
```

Open `http://localhost:4200`.

- **WASD** move, **mouse** aim turret, **hold click** to fire
- Level up in-run for stats; unlock weapon-tree nodes between runs with scrap

## Screens

**Home** — Title and pitch. Start a run, or open the Hangar first.

**Hangar** — Between-run hub. See scrap, unlock weapon-tree nodes, equip one active loadout path, check best time and milestones, then Deploy.

**Run** — Full-screen arena with HUD (HP, level, timer, kills, XP). Overlays pause the action for:

- **Level up** — pick 1 of 3 bubble boosts
- **Popped!** — run summary (time, kills, level, scrap) → Hangar, Retry, or Home

No pause menu, map select, or settings screen yet.

## A run

You enter with whatever cannon path you equipped in the Hangar (default: Bubble Cannon).

- Move with WASD; the hull faces how you move
- Aim the turret with the mouse; hold click to fire
- Enemies densify over time: chasers and swarmers first, then brutes, ranged spitters, and suicidal exploders
- Kills drop XP gems; pick them up to level and choose a temporary boost (armor, speed, damage, fire rate, magnet range)
- Bosses at **5:00** and **10:00** are milestones, not a finale
- When HP hits zero → scrap from time + kills → back to Hangar

In-run upgrades are stats only. Weapon identity is what you chose before the run.

## The Hangar

Scrap funds a single starter cannon tree (~12 nodes). You can unlock siblings over time, but each run you equip **one contiguous path** from the Bubble Cannon root down to a leaf. Other unlocks stay owned; they just aren’t active until you re-equip that branch.

Branches feel different: rapid / laser / needle gum vs spread / waves / 360 pop vs heavier bubbles. Deeper nodes need both scrap and survival milestones (notably lasting 5 and 10 minutes).

## How it fits together

```text
Home → Hangar (spend scrap, pick a branch) → Deploy
         ↑                                      │
         └── Popped! (scrap + milestones) ←─────┘
                    Survive waves + bosses,
                    level stats mid-run
```

Identity lives in the Hangar; improvisation lives in the arena. The tree says _how_ you shoot this run; level-ups say how hard you push that identity before you pop.

## Future plans

V1 is a tight desktop loop. Deferred ideas:

- Extra weapons and **gadgets** (mines, drones, auras)—not just one deep cannon path
- Real terrain / authored maps (today’s arena is a soft open circle)
- Objectives beyond “survive as long as you can”
- Mobile / touch controls
- Polished sprites instead of procedural bubble art
- Sound polish, multiplayer, cloud/account saves
- Possibly a third boss beat around 15 minutes (V1 has 5 and 10)

Boss-defeat gates are labeled in the Hangar as scaffolding; deeper tree nodes mostly gate on survival time for now.

## Stack

- Angular 19 (routing, hangar UI, HUD, `localStorage` meta save)
- PixiJS 8 (arena simulation + procedural bubble art)
