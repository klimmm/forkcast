// calls.js: COPY: every word the phone shows

import * as E from '../../plan/engine.js';
import { fmt, chipName, plural } from '../../ui.js';
import { AWAY, EPS, MINUS, ORD, WORDS, andList, gwList, gwsWords, hitsWords, ids, num, pts, range, rankOrd, rankShort, setsRow, setsSaid, signedMoney, span } from './helpers.js';
import { priceSaid } from './prices.js';

// ---------------------------------------------------------------- copy (IPHONE_DESIGN §9, §7.9, §5)

/** A sentence that ends in a name ends once: "Not Bruno G." never reads "Bruno G..". */
export const sentence = (text) => (/[.!?…]$/.test(String(text)) ? String(text) : `${text}.`);

/** A Wildcard or Free Hit week in words: what the chip makes of it and (Free Hit) the free transfers kept for the week
 *  after (ftNext). */
const chipWeekWhat = (chip, gw, ftNext = null) => (chip === 'fh'
  ? `one-week squad, back to your team in GW${gw + 1}${ftNext == null ? '' : ` · ${ftNext} FT kept for GW${gw + 1}`}`
  : 'unlimited transfers this week');
export const COPY = Object.freeze({
  span,
  range,
  /** C-badge drag tip: the armband on him against the captain now, in the one measure; no weak-call mark (owner,
   *  2026-10-18). */
  capGap: (delta, vsName) => `${pts(delta)} pts vs ${vsName} (C)`,
  capNow: 'Captain now',
  /** The V's drag (ahead.js dragBadge; owner, 2026-10-13): words beside the finger, no number (the vice scores only if
   *  the captain misses): over a starter, the vice, the captain (the armbands swap), or no starter. */
  viceTo: (name) => `${name} · vice`,
  viceStays: 'Vice now',
  viceSwap: (name) => `${name} · the armbands swap`,
  viceDrop: 'Drop the vice armband on a starter',
  /** ahead.armbandSheet's title. */
  armIn: (arm, gw) => `${arm === 'v' ? 'Vice-captain' : 'Captain'} · GW${gw}`,
  /** A player-you-have's card buttons: sell him and choose who comes in; swap him with a sub. */
  replaceGo: 'Replace…',
  subGo: 'Sub…',
  /** Replace's "Let Forkcast choose" (owner, 2026-10-13): the sale alone yours, the buy the full plan's
   *  (ahead.sellAny). */
  autoBuy: 'The full plan picks who comes in',
  /** A lifted shirt's line under the switcher (ahead.js liftShirt): the players he can swap with outlined on the pitch
   *  (engine.swapCandidates), the weeks he can be sold from glowing. `out`: the Wildcard or Free Hit week that brought
   *  him in, where a drop rules him out of its squad. */
  liftShirt: (name, swap, sell, out = null) => (out != null
    ? `Drop ${name} ${[swap ? 'on a player to swap them' : null, `on GW${out} to rule him out`, sell ? 'on a later week to sell him' : null].filter(Boolean).join(', or ')}`
    : swap && sell ? `Drop ${name} on a player to swap them, or on a week to sell him`
      : swap ? `Drop ${name} on a player to swap them` : sell ? `Drop ${name} on a week to sell him from then`
        : `No swap or week works for ${name}`),
  /** How many forecast runs back the pooled call: for the Why sheet, never a verdict. */
  agreement: (lead, runs) => `${lead} of ${runs} forecast runs`,
  /** An edit's verdict against the plan before it (changeText): forecast points minus hits, the direction in words, not
   *  only colour. `total`: take and remove toasts name what your total moves by (changeNum; owner, 2026-10-21). */
  change: (what, delta, label, gws, total = false) => `${what} · ${COPY.changeNum(delta, total)}`,
  changeNum: (delta, total = false) => (total ? `total ${pts(delta)}` : `${pts(delta)} pts`),
  /** An edit's subject in plain words, one form for every way in: "Bassey in your plan" (GW A: the move is the plan's
   *  until you make it in FPL), "Bassey in GW7"; with the player he replaces, "Bassey in for Chilwell in your plan". */
  cameIn: (names, gw = null) => `${andList(names)} in ${gw != null ? `GW${gw}` : 'your plan'}`,
  cameInFor: (name, outName, gw = null) => `${name} in for ${outName}${gw != null ? ` · GW${gw}` : ' in your plan'}`,
  /** What an edit takes off: one thing, or a list said once ("Groß → Dewsbury-Hall and Calvert-Lewin → Mateta
   *  removed"). */
  removed: (what) => `${Array.isArray(what) ? andList(what) : what} removed`,
  /** A choice making a move you removed this session (ahead.plansOf `removed`: after the others, never lit): its Week
   *  sheet row, spoken line and card note (owner, 2026-10-21). */
  removedByYou: 'removed by you',
  /** …with your later sale of the player it bought, which has no one to sell then (ahead.removeMove). */
  /** Your transfer made in another GW, its toast's subject ("Chilwell → Bassey moved to GW7"). */
  movedTo: (move, gw) => `${move} moved to GW${gw}`,
  /** The Why sheet's When line ("why this week and not next"), labelled "If made in" ("When … each week" read as a
   *  per-week split): each week read out as one you can move your transfer to, the move's own week, or "—" where it
   *  can't be made. A tap chooses a week; the button under the line carries the verb ("Move it to GW7", whenVerb; read
   *  out whenMove). */
  whenHead: 'If made in',
  /** …what its numbers count against, under it and in its label (owner, 2026-10-22: one baseline per sheet): `vs` the
   *  header's ("vs rolling"), else keeping the player it sells (vsKeeping); Chips… says each row's own: chipNoChip. */
  whenVs: (vs, gws) => `Points over ${span(gws)} ${vs}`,
  whenVerb: 'Move it to',
  whenMove: (gw, delta) => (delta == null ? `${COPY.whenVerb} GW${gw}` : `${COPY.whenVerb} GW${gw}: ${pts(delta)} pts`),
  whenHere: (gw, delta) => (delta == null ? `GW${gw}, its week` : `GW${gw}, its week: ${pts(delta)} pts`),
  whenNone: (gw) => `GW${gw}: can't be made`,
  /** A week you can choose (a tap selects it; whenMove moves it there). */
  whenWeek: (gw, delta) => (delta == null ? `GW${gw}` : `GW${gw}: ${pts(delta)} pts`),
  /** The Why table's forecast group (sheets/why.js pairTable). */
  gridUnit: 'Forecast xP',  // a forecast's unit is "xP" everywhere
  /** The stats' head, the Why table's and the player card's: their rounds, and in the Why table whom its ranks are
   *  among: "Stats · GW1–7 · ranks among 84 midfielders", `n` his position's ranked players (api/card.py _strip),
   *  `word` its plural (sheets/player.js WORD); rounds alone without them. */
  statsHead: (g0, g1, n = 0, word = null) => `Stats · ${range(g0, g1)}${n > 0 && word ? ` · ranks among ${n} ${word}` : ''}`,
  /** …and under the Why table, once, the stats set apart from the forecast, so the last matches' points above aren't
   *  taken for the forecast. */
  statsPast: (gws) => `Stats are past matches; the ${span(gws)} points above are the forecast.`,
  captainNow: (name) => `${name} captain`,
  viceNow: (name) => `${name} vice`,
  /** A funding sale's row and Why: what it frees, and what it scores alone. */
  funds: (money, name) => `Frees ${money} so ${name} fits`,
  /** The tie's other end, on the buy's row: the sales that fund it ("with Haaland → Thiago"); on a sale whose money a
   *  later week's buy needs ("Pays for B.Fernandes in GW8 and Palmer in GW9"). */
  fundedBy: (moves) => `with ${andList(moves)}`,
  /** A transfer's money on its Why line ('→' is a transfer's alone): what its sale frees beyond its buy, or what the
   *  buy takes from the bank, with the bank it takes it from where known (`bank`); null when equal. */
  frees: (x, bank = null) => (Math.abs(x) < 0.05 ? null : x > 0 ? `frees ${fmt.money(x)}` : `${fmt.money(-x)} from the bank${bank ? ` (${bank})` : ''}`),
  /** A week with no transfer, its verdict by who left it empty (ahead.emptyHead): under the hold the Roll's own
   *  "No transfer made" (COPY.noTransferMade; owner, 2026-11-05: one name, whether or not there is a move); no edit reaches it (GW A under way) "No transfers"; off the hold,
   *  a week Forkcast's plan leaves empty "Forkcast rolls GW8" ("No transfers" while an edit's check may still re-plan
   *  it, or where a Roll rule holds: rollRule). */
  noTransfers: 'No transfers',
  forkcastRolls: (gw) => `Forkcast rolls GW${gw}`,
  rollKeeps: (ft, gw) => `${ft} FT in GW${gw}`,
  /** …on the card, spelled out (books review 2026-11-08: "2 FT" never spelled out under a title that spells it). */
  rollKeepsCard: (ft, gw) => `${plural(ft, 'free transfer')} in GW${gw}`,
  /** …read out in full (aria-label): "2 free transfers in gameweek 7". */
  rollKeepsSaid: (ft, gw) => `${plural(ft, 'free transfer')} in gameweek ${gw}`,
  /** The week's free transfers, said first on a week with none of yours: "1 FT". */
  ftNow: (ft) => `${ft} FT`,
  ftNowSaid: (ft) => plural(ft, 'free transfer'),
  /** The week's bank after its moves (fmt.money's words), said after its free transfers (ahead.factsWords; owner,
   *  2026-10-21), in FPL's word, never shortened: "£0.8m ITB"; read out "£0.8 million in the bank". */
  itb: (money) => `${money} ITB`,
  itbSaid: (money) => `${money.replace(/m$/, ' million')} in the bank`,
  inTeam: (name) => `${name} is in your team already.`,
  /** A buy whose every sale of his position is a player your Keeps hold, by the first GW a Keep holds them. */
  keptIn: (names, gw) => `${andList(names)} ${names.length > 1 ? 'are' : 'is'} kept in GW${gw}.`,
  /** A buy no single extra sale pays for: what it needs, and another week only when that week fits him. Any edit short
   *  of money says it, the buy named where known (null: "Needs £1.2m more in GW6."). */
  noFit: (name, short, gw, tryGw = null) => `${name ? `${name} ${COPY.moneyNeeds(short)}` : COPY.moneyNeeds(short).replace(/^n/, 'N')} in GW${gw}.${tryGw ? ` He fits in GW${tryGw}.` : ''}`,
  /** The weeks a later week's numbers count, its GW to the window's end ("GW8–9"); the suggested plans' label names
   *  them (COPY.suggested). */
  valuedOver: (gws) => span(gws),
  /** The move if its buy misses its GW (scored 0 there: ahead.ifMisses), and what it makes when he plays (`base`, where
   *  the two differ as shown). */
  ifMisses: (name, gw, delta, base = null, vs = null) => `if ${name} misses GW${gw}: ${pts(delta)}${base != null && pts(base) !== pts(delta) ? `, not ${pts(base)}${vs ? ` ${vs}` : ''}` : ''}`,
  /** The week's better use of the free transfer your transfer takes (ahead.otherUseOf), a move now in its place, never
   *  a fallback, and what your transfer makes with it (`mine`): "Better use of this free transfer: Scott → Groß +7.5,
   *  not +2.3". */
  instead: (move, delta, mine = null, vs = null) => `Better use of this free transfer: ${move} ${pts(delta)}${mine != null ? `, not ${pts(mine)}${vs ? ` ${vs}` : ''}` : ''}`,
  /** The baseline a Why fact's ", not X" names when the sheet's header counts against rolling ("+0.4 vs rolling" over
   *  "…, not +2.8" read as two numbers for one move). */
  vsKeeping: (name) => `vs keeping ${name}`,
  /** A buy the money can't pay, shown and said alike (Add a player's Sells chip, Replace's row): "£5.0m short". */
  moneyShort: (x) => `${fmt.money(x)} short`,
  /** …the same fact after the sale or buy it is about, in noFit's words: "Groß · needs £5.2m more". */
  moneyNeeds: (x) => `needs ${fmt.money(x)} more`,
  /** An edit's toast at once, with its Undo, while the full plan solves (its verdict replaces it in place); from 5 s
   *  its age after the ellipsis ("Planning Groß in your plan… 0:12"), and while the server is away the wait it is in. */
  // (every solve's wait has one word, an edit's, a week's checks, a chip's, a bring-in's and the plan's alike: owner,
  // 2026-11-03, "not split Planning and Planning solves and not treat them differently")
  waitWord: 'Planning',
  pendingEdit: (what, so = null) => `${COPY.waitWord} ${what}…${so ? ` ${so}` : ''}`,
  pendingOffline: (what) => `${what} · waiting for the connection`,
  /** An Undo said once, with no button, in the edit's own words ("Undone: Groß in your plan", ahead.undoOf); `gw`: the
   *  week after them unless they name it already. The state it leaves, never a double reversal (owner, 2026-10-22): a
   *  clause the edit said "… removed" or "… taken off" now reads "… back", one it said "… back" now "… removed";
   *  "Undone: " only before a first clause that stays as said ("Undone: GW8 Saka → Palmer · GW8 frozen"), else none
   *  ("Saka → Palmer back · GW8 frozen back"). A removal takes its own rules alone (owner, 2026-10-26): no clause to
   *  turn. */
  undone: (what, gw = null) => {
    const turn = (c) => c.replace(/ (removed|taken off)$/, '\u0000').replace(/ back$/, ' removed').replace(/\u0000/g, ' back');
    const parts = what.split(' · '), said = parts.map(turn).join(' · ');
    return `${turn(parts[0]) === parts[0] ? 'Undone: ' : ''}${said}${gw != null && !new RegExp(`\\bGW${gw}(?!\\d)`).test(what) ? ` · GW${gw}` : ''}`;
  },
  /** The forecast noise (meta.noise, its GW): the You sheet's Status row and the Player data sheet's note. */
  noiseValue: (noise, gw) => `${fmt.num(noise, 2)} pts (GW${gw})`,
  /** Help (the header's "Help", You → Help): a three-sentence lead, then one section per task, each a short list of
   *  actions in the app's own control names, each folding on its own (helpSheet: its head a button, the first open).
   *  Covers: a plan's + freezes its week (a Roll in Your rules), the card's Keep / Force out, the pitch's drags and
   *  holds, Chips… and Bring in… on the week line, the sign-out after FORGET_MS away. */
  helpShort: 'Help',
  /** Settings (Ahead's header gear, in Help's old place; owner, 2026-10-29): its sheet's title and the gear's name. */
  settingsTitle: 'Settings',
  /** …and the way to it, in Help's lines and a locked week's toast. */
  settingsDoor: 'tap the settings icon at the top left',
  /** The first-use hints, each one line until its action is done once (ahead LEARN_KEY), in Help's words: the Week
   *  sheet's first transfer row's (its swipe; the veto's own words, "Not Groß"), the pitch's two lines (a shirt's hold:
   *  a sub or a sale; the C's or the V's drag) and, in the same corner once those are learnt, the chips' two (the GW
   *  tiles' codes: the corner is too narrow for names at 375 px). Help brings them back (tipsAgain). */
  // the veto's one word, as its Why button and rule chip say it (owner, 2026-10-22)
  hintRow: (name) => `Swipe left: Not ${name}`,
  // the chips' names whole (review 7 B18: no codes in a hint); each line whole or the hint gives way (placeHint)
  hintChips: ['Hold C: Triple Captain', 'Hold bench: Bench Boost'],
  tipsAgain: 'Show tips on the screen again',
  helpLead: 'Forkcast plans your FPL team up to four gameweeks (GWs) ahead. It can\'t change your FPL team: make your transfers in the FPL app before the deadline. Each change shows a message with Undo.',
  /** → [[head, [bullet], clip?]], in the order a first visit needs them; `clip`: the section's recording on the real
   *  app (static/m/clips, sheets/about.js clip); `noise` and `gw` (ahead.inputsOf) are read by no line now. Bullets say
   *  what each number counts against (the total: your plan; a choice: rolling; a Sell list's ≈: keeping him), a chip's
   *  best week (chipBests, honestBest), how long checks take (minutes for the Chips sheet's), a take's message with its
   *  two numbers and Why, and the week line's facts in a GW with no transfers (ahead.factsWords); never the noise's
   *  points (Dev mode's: you.js paintDev). */
  help: (noise = null, gw = null) => [
    ['Plan your transfers', [
      'Pick a GW at the top, or swipe the pitch.',
      // (the band, its marks and his place: owner, 2026-11-03, design_1103b "Place header + Help text")
      'Forkcast\'s best move for a GW is the dark strip above the pitch; the player it sells is framed on the pitch.',
      'Swap takes it. ✕ by the player coming in: not him this GW, and the next best shows.',
      'The lock by the player going out: keep him this GW.',
      // (a card's ×, not ⇄: FPL's substitution sign; owner, 2026-11-03, "Back to ×")
      'Tap × on a player\'s card for his place: the choices for his spot, each with its number and Swap.',
      'In a player\'s place, Keep over his own card keeps him that GW: nothing sells him.',
      'Rolling is making no transfer: your free transfer carries over to the next GW.',
      // the rule a take adds, by its own word (rollRule; owner, 2026-10-22: never "lock", the plan length's padlock): a
      // transfer's "GW8 frozen", the Roll's "GW8 roll", a Wildcard's or Free Hit's its chip
      'Taken transfers lock their GW (Your rules: locked): Forkcast changes nothing there. Roll adds a roll rule; Wildcard or Free Hit, the chip.',
      `Tap the line above the pitch for that GW's transfers, ${COPY.plansHead} and your rules.`,
      // its free transfers in every week, before its transfers (renderLine's weekLead)
      'The line above the pitch shows each GW\'s free transfers (FT) and money in the bank (ITB); with no transfers, the next GW\'s FT too.',
    ], 'plans'],
    ['Bring in a player', [
      `Tap ${COPY.bringInShort} (above the pitch, beside ${COPY.chipsDoor}), then + beside a player.`,
      'Pick a GW, then under Sells tap who goes out, even short of money.',
    ], 'bringin'],
    ['Your players', [
      'Tap a shirt for his card: Keep, or Force out (one week, or sold from a week on).',
      // the venue's case in words (review 7 B17: never case alone)
      `Opponents under the shirts: ${COPY.oppCase}.`,
      'Under Force out, From GW… lets you choose who comes in, or Let Forkcast choose.',
      'Hold a shirt, then drop it on an outlined player to swap them, or on a GW to sell him from then.',
      'Tap the C or the V to pick who wears it from a list.',
      'Tap a sub\'s order on the bench (1st, 2nd or 3rd) to pick who he replaces from a list.',
      'Hold the C or the V, then drop it on a starter. The V on the C swaps them.',
    ], 'replace'],
    ['Change a transfer', [
      'Tap the line above the pitch, then × on your transfer to remove it.',
      `Tap the player tagged IN, then a GW under “${COPY.whenHead}”, then ${COPY.whenVerb} that GW.`,
    ], 'xfer'],
    ['Keep a player, or say Not to one', [
      'Tap the line above the pitch. Swipe a transfer left: Not the player it buys, in that GW.',
      'A Wildcard or Free Hit week\'s changes work the same.',
      'Your rules, at the end of that list, shows what you set. Tap one, then Remove.',
    ], 'rules'],
    ['Settings', [
      `Hits: ${COPY.settingsDoor}, then ${COPY.hitsHead}.`,
      `How many GWs it plans: ${COPY.settingsDoor}, then ${COPY.aheadHead}.`,
    ]],
    ['Play a chip', [
      `Tap ${COPY.chipsDoor} (above the pitch, beside ${COPY.bringInShort}), then a chip. Each shows its best week.`,
      'Triple Captain: hold the C still.',
      'Bench Boost: hold the bench where no shirt is.',
      `The same hold again, or ${COPY.chipTakeOff} in ${COPY.chipsDoor}, takes it off.`,
      'Best week: of the GWs your plan covers in its half of the season, where it gains most against not playing it.',
      // one baseline per chip (owner, 2026-10-22; ahead.chipNumber), each row naming its own
      'A Wildcard or Free Hit\'s number is vs rolling that GW, as a plan\'s. Bench Boost and Triple Captain: vs not playing it.',
      `${COPY.chipNoBestName}: no GW beats the next best by enough to act on. GWs past your plan aren't planned.`,
      `A chip's numbers can take minutes; its row says ${COPY.waitShort} until then.`,
    ], 'chips'],
    ['What the numbers mean', [
      'Points are forecast FPL points for a typical week, not a promise, minus 4 for each hit.',
      'The total at the top: your plan\'s points, no transfers unless you add them.',
      // one phrase for the baseline, "vs rolling" (owner, 2026-10-22: no "beats rolling", "against rolling")
      'A transfer\'s number: what it adds to your weeks\' xP, the change you then see on the tabs.',
      'A plan\'s number: the same, all its transfers together. Roll has no number: it keeps your team as it is.',
      // compared to the transfer made, not rolling (owner, 2026-10-25)
      'In a GW with a transfer, Wildcard or Free Hit of yours, every choice, Roll too, is vs your plan: worse than yours is negative.',
      'Vs rolling, both sides get Forkcast\'s best later moves (none after a Wildcard), so the free transfer rolling saves can be used.',
      'Taking a choice adds its GW\'s moves alone, not the later ones its number counts, so the total can move by another amount.',
      // (owner, 2026-10-26: "what means +1.6 vs rolling but total +5.1"; the message carries no number since
      // 2026-10-27)
      'The total at the top shows its own change once the message goes.',
      'Green: it beats the alternative by enough to act on.',
      'Grey: not worth acting on: a plan or chip that doesn\'t beat what it counts against by enough, or a gap too small to matter.',
      // (owner, 2026-10-21: worse ones are listed too, grey; the moves the bars keep from being the week's suggestion:
      // ahead.plPays `early`)
      'Grey too: a move that adds next to nothing or loses when taken, or is as good a GW later.',
      'A transfer, Wildcard or Free Hit in your plan: amber when its gain is small, red when it loses by enough to matter.',
      // (owner, 2026-10-26: the plan is never drawn from an estimate; every squad is the solver's)
      'While a change is planned, the plan before it shimmers until the new one is in. Planning can take from seconds to several minutes.',
      '≈ before a number in a list: Forkcast\'s quick estimate. Every squad and number of your plan is its solver\'s.',
      '≈ in a Sell list is vs keeping him. Once made, the transfer\'s number is vs rolling instead, so it can differ.',
    ]],
    ['What the marks mean', [
      // (owner, 2026-10-26: the black plate the transfer week's, a black ring after it)
      'Black name plate: bought this GW; tap him for who he replaces and why.',
      'Black ring round a name: bought in an earlier GW of your plan, not in your FPL team yet.',
      // (owner, 2026-10-26: struck old points)
      'Struck number on a GW: its points with no transfers of yours, beside its points with them.',
      'Dot in a GW\'s corner: your own lineup there. Reset (pitch, top left) brings the best one back.',
      `Lock on a GW: past your plan (${COPY.aheadHead}). Tap it to see how to plan it.`,
    ]],
    ['Prices and news', [
      'Before a price change, the line above the pitch says whether to make your transfer tonight. Hide, in its list, puts it away.',
      'Player data (pitch, top right): choose what shows under each shirt.',
      'On a player\'s card, tap ⓘ to read what a chart shows.',
    ]],
    ['Start over', [
      'Tap your initials, then Reset all weeks.',
      // (the pitch's pill, owner, 2026-10-21; ahead.planHasYours, resetFits)
      'Reset all weeks is on the week\'s card too while your plan has a transfer, chip or rule of yours.',
      `Leave Forkcast for more than ${AWAY} and it signs you out of the team and clears its choices.`,
    ]],
  ],
  /** About Forkcast (sheets/about.js): under Connect's form for whoever reads on, and from Help and the You sheet
   *  (owner, 2026-10-14). Its questions are those r/FantasyPL's Rate My Team threads ask most, in managers' words, most
   *  asked first, each answered by a recording of the screen (whyApp: static/m/clips,
   *  tools/qa/scenarios/about-clips.mjs); no Reddit figure on the page. Results are finishing ranks inside a season,
   *  never points across seasons; nothing says when to play a chip. Never "beats", "proven" or "guaranteed". */
  whyTitle: 'About Forkcast',
  whySub: 'Roll or transfer, A or B, who to bench, whether the −4 pays: Forkcast works it out for your squad, your bank and your free transfers, in points over the next four gameweeks.',
  whyStart: 'Find my team',
  /** One a question (`clip`: static/m/clips/<clip>.webp, recorded on the real app), the most asked first. */
  whyApp: [
    { clip: 'plans', ask: 'Roll or make a transfer?', text: 'Forkcast\'s best buy waits behind the player he would replace, scored vs rolling the transfer: the points it adds over the next four gameweeks. One tap takes the transfer, and the player you sold waits behind him to take back.' },
    { clip: 'replace', ask: 'A or B? Who replaces him?', text: 'Drag a player onto a gameweek and everyone who could come in for him is ranked, with the money your bank allows.' },
    { clip: 'rules', ask: 'Keep your player, or rule one out?', text: 'Tap the line above the pitch, then swipe a transfer left: Not the player it buys. It holds for that gameweek, goes into Your rules, and the plan is made again around it.' },
    { clip: 'bench', ask: 'Who starts? Who\'s on the bench?', text: 'Forkcast picks your XI, captain and bench order for every gameweek, the bench in the order FPL\'s auto-subs use.' },
    { clip: 'bringin', ask: 'Take a −4 now, or wait a week?', text: 'Name any player: see what bringing him in gains in each of the next four gameweeks, a −4 taken off in a week that costs one, and who Forkcast would sell to pay for him. Take the best week in one tap.' },
    { clip: 'player', ask: 'Will he start? Is he worth it?', text: 'Tap a player for his card: his team news, his last six matches with the cup and international games between them, his next seven forecasts, and the stats that best foretell his points, ranked against his position.' },
  ],
  /** The seasons replayed (why.json records: the rank after each GW, on the solver's own tables). */
  /** How it works' folded row over the seasons replayed and the scouts' tables (sheets/about.js `proof`). */
  // (the scouts' tables open on this season's live one: owner, 2026-10-14)
  whyProof: 'How it did: past seasons replayed, and this season against the scouts',
  whyRecordHead: 'Replayed over whole seasons',
  whyRecordLead: 'The planner run through a past season one deadline at a time, knowing only what was known then: every transfer, captain and bench its own. Its chips were played in weeks set beforehand.',
  whyPlace: (r) => `${fmt.ordinal(r.ranks.at(-1))} overall`,
  whyPlaceOf: (r) => `in ${COPY.seasonOf(r.season)}, replayed`,
  whyRankAxis: 'Overall rank after each gameweek',
  whyRecordNote: (r) => `A replay, not a real entry: nobody played this team.${r.estimated ? ' Its weekly ranks are estimated; the final one is from FPL\'s final table.' : ''}${r.am ? ` It can't play the Assistant Manager chip, so +${r.am} is credited for it.` : ''} Forkcast's settings were tuned on these seasons, so they flatter it, and one season is partly luck.`,
  /** The same replays at 1-4 GWs (why.json horizons: each one's final rank). */
  whyHorizon: 'The same replays planning one to four gameweeks at a time. Across both seasons four came out best, so Forkcast plans four; each season\'s best is in bold.',
  whyHorizonCols: ['Plans ahead', 'Final rank'],
  whyHorizonRow: (w) => (w === 1 ? '1 gameweek' : `${w} gameweeks`),
  /** The fresh-team benchmark (GET /api/m/scouts this season, why.json scouts the seasons replayed): every team's XI
   *  after FPL's auto-subs, net of its captain, the scouts named; no count of weeks won (owner, 2026-10-14). */
  whyScoutsHead: 'Against the scouts',
  whyScoutsLead: 'Every week Forkcast also picks a fresh fifteen, as the scouts do. Each team is scored the same way: its XI after FPL\'s auto-subs, without the captain\'s double.',
  whyScoutsLive: (s) => `${COPY.seasonOf(s.season)} so far, live: a real FPL team (ID ${s.entry}) built from Forkcast's fifteen before every deadline. Updated after every gameweek.`,
  whyScoutsReplay: (s) => `${COPY.seasonOf(s.season)}, replayed: Forkcast's fifteen each gameweek against every squad a scout posted.`,
  whyScoutsCols: ['', 'GWs', 'Forkcast', 'Scout'],
  // the tuning caveat once, in the replays' note above it (owner, 2026-10-14)
  whyScoutsNote: 'Scored on the gameweeks each scout posted a squad.',
  seasonOf: (s) => `${s}/${String(s + 1).slice(2)}`,
  whyHowHead: 'How it works',
  /** [lead, rest]: only what holds through a retrain (owner, 2026-10-14); it learned from other competitions too
   *  (modules/leagues.py BUILD_LEAGUES: the club cups and Europe; national-team games are fetched but read by no model
   *  input); the pool (ml/configs/utils/paths.py PROD_PRED_DIRS) is checkpoint sets of different structure, a dozen or
   *  more seeds each, averaged. Nothing says Forkcast is free. */
  whyHow: [
    // (no model talk: owner, 2026-11-03, design_1103b "Place header + Help text": Podmajersky, Johnson)
    ['It forecasts every player.', 'Each player\'s points for his next seven fixtures, learned from every Premier League season since 2009/10 and his cup and European matches, from match data, team news and prices, never ownership.'],
    ['It plans four gameweeks at once.', 'Transfers, XI, captain and bench are solved together within FPL\'s rules (your players\' selling prices and your bank, three per club, free transfers banked, −4 hits), around any chip you play.'],
    ['It\'s fresh before every deadline.', 'The data is fetched and the forecast re-run every night and again before each deadline, ready 75 minutes before it for the late team news.'],
  ],
  whyFacts: [
    ['No login.', 'Type your team\'s name or ID: no account, no password.'],
    ['It never touches your FPL team.', 'You make the moves in the FPL app.'],
    ['A forecast is a typical week, not a promise.', 'A good plan still loses some weeks: judge it over a run of them.'],
  ],
  whyLegal: 'Not affiliated with the Premier League or FPL.',
  /** The noise's one name on screen (the solver's per-transfer charge at the anchor; `noise` stays the code's name),
   *  never "margin of error": the You sheet's Dev row, the Why sheet's sentences and run strip. */
  /** The Player sheet's stats key, first (api/stats_pick.json, tools/stats_pick.py; chosen by data, owner, 2026-10-14):
   *  `word` his position's plural ("midfielders"), `kinds` the kinds of points his rows foretell in his order
   *  (api/card.py _kinds, _rows), `his` false when he has too few minutes to be ranked (the position's order then). */
  chargeName: "Forkcast's charge for a transfer",
  charge: (noise) => `${COPY.chargeName} (${fmt.num(noise, 2)} pts)`,
  /** The player sheet's match-strip legend: the run ticks are the model runs' agreement, not the points he may score;
   *  `ticks` false (off a local page none are drawn) drops their clause. */
  barWidth: 'Bar width = minutes.',
  runSpread: (ticks = true) => `${COPY.barWidth} Forecast = a typical week, not a ceiling${ticks ? '; its ticks show how far the forecasts agree' : ''}.`,
  /** An opponent's venue as every screen writes it (pitch.oppText): the player sheet's chart key and Player data's. */
  // in words too: a screen reader says "EVE" and "eve" alike
  oppCase: 'capitals at home (EVE), lower case away (eve)',
  /** An own pick's side effects in its GW (ahead.sideEffects) and the hit it may take (the Replace rows). */
  replaces: (moves) => `replaces ${moves}`,
  adds: (moves) => `adds ${moves}`,
  hitsIn: (n) => (n ? `${MINUS}${E.HIT_COST * n}` : 'no hit'),
  afterHit: (n) => `after ${n > 1 ? `${WORDS[n] ?? n} hits (${MINUS}${E.HIT_COST * n})` : `a ${MINUS}${E.HIT_COST}`}`,
  /** A8: Replace's hit, said once over its list: the rows' numbers count it. */
  replaceHit: (gw, others = null) => `A buy here is an extra transfer in GW${gw}: its ${MINUS}${E.HIT_COST} is counted in each number${others ? `, or Forkcast drops ${others} instead` : ''}.`,
  /** Replace's and Add a player's search that finds no one, the typed text quoted, and the way out (FPL's names are
   *  mostly surnames): "No midfielder called “Emile”. …". */
  noneCalled: (who, q) => `No ${who} called “${q}”. Try his surname as FPL writes it.`,
  /** The bank a Replace row spends from: GW A's is the bank now, a later GW's the one after the week before; with other
   *  transfers that week (`others`) the one after them. */
  bankNow: (money, gw, A, others = false) => (others ? `${money} in the bank after GW${gw}'s other transfers`
    : gw === A ? `${money} in the bank now` : `${money} in the bank after GW${gw - 1}`),
  chipLess: (x, gw) => `${fmt.num(Math.max(0, x))} less than in GW${gw}`,
  /** A chip planned (its verdict toast, ahead.chipPlan): what was played, then what the week gives up against the
   *  chip's honest best (`less`, chipLess: "3.0 less than in GW8"), left out where unknown; no number "vs …" (owner,
   *  2026-10-27). */
  chipToast: (what, less = null) => [what, less].filter(Boolean).join(' · '),
  /** …when the planner's own count parts from the points (a rule is never called better by a count the planner
   *  disagrees with): the points, then why. way: 'better' | 'worse' by its count, 'no better' | 'no worse' with none
   *  (an estimate claims no count; a count inside the noise is changeLevel's). */
  changeAgainst: (what, delta, gws, reason, way, total = false) => `${what} · ${COPY.changeNum(delta, total)} · Forkcast rates it ${way}: ${reason}`,
  changeLevel: (what, delta, gws, reason, total = false) => `${what} · ${COPY.changeNum(delta, total)} · Forkcast rates them level: ${reason}`,
  /** A lineup change (a sub, the armband, a reset): its GWs' points (gw: one GW or a list), as a gain or a loss. */
  lineup: (what, gw, delta, label) => `${what}${[].concat(gw).length > 1 ? ` (${gwList([].concat(gw))})` : ''} · ${pts(delta)} pts`,
  /** …of one GW after GW A: the GW said with it ("Saka captain in GW8"). */
  inGw: (what, gw) => `${what} in GW${gw}`,
  /** Two subs swapped (ahead.sub): the bench order they make, [[name, n]] ("Bench order: Walle Egeli 1st, Murillo 3rd";
   *  n counts subs after the keeper). */
  benchOrder: (subs) => `Bench order: ${subs.map(([name, n]) => `${name} ${ORD(n)}`).join(', ')}`,
  /** A week's Roll rule (memory.pinRoll; owner, 2026-10-13: a suggested plan's + keeps that week exactly its choice):
   *  "GW8 roll", the Roll row's and plan row's words (planRoll), or with k moves of yours kept there "GW8 frozen"
   *  (owner, 2026-10-22: not "lock", the plan length's padlock and FPL's price lock). A noun, as named in a toast too
   *  ("Vuskovic in your plan · GW8 roll removed"). */
  // ("locked", the GW tile's lock: review 7, 2026-11-02, "frozen" read as jargon)
  rollRule: (gw, k = 0) => (k ? `GW${gw} locked` : COPY.planRoll(gw)),
  /** A Roll + in a week with nothing to take back (ahead.addPlan): the rule it made and what it does. */
  rollMade: (gw) => `${COPY.rollRule(gw)} in Your rules: no transfer in GW${gw} until you take one`,
  /** The retired Auto-plan segments (ahead.gwModes): "Off", "FT only", "Up to −4", "Up to −8" (the solver's own cap);
   *  one line each (owner, 2026-10-08). "FT only" still names a hits rule of 0 (freeOnly, gwNote, memory.ruleText). */
  segFreeOnly: 'FT only',
  /** Settings → Hits (owner, 2026-10-12; ahead.hitsChoices): the hits Forkcast may take a week, every week, one
   *  setting: its heading, its segments ("None", "−4", "−8"), the line under it, its toast's subject and the rule it is
   *  (memory's derived 'hits' pin). */
  // ("a week" read as a duration, "Its … take no more" pointed two phrases back)
  hitsHead: 'Most hits per GW',
  hitsSeg: (n) => (n === 0 ? 'None' : `${MINUS}${E.HIT_COST * n}`),
  hitsNote: 'Forkcast\'s suggestions and the transfers it adds stay within this.',
  hitsMax: (n) => (n === 0 ? 'Hits: none in any week' : `Hits: up to ${MINUS}${E.HIT_COST * n} a week`),
  /** Settings → Plan ahead (owner, 2026-10-14): how many GWs Forkcast plans from the next deadline (planWeeks): its
   *  heading, segments, the line under it, and the one line why the locked options can't be picked (meta.locked). */
  aheadHead: 'Plan ahead',
  aheadSeg: (n) => (n === 1 ? '1 week' : `${n} weeks`),
  aheadNote: 'The GWs after your plan show a lock at the top.',
  // Settings → Solver gap (owner, 2026-11-03): how close to the best the solver must prove its plan, this GW and later
  gapHead: (later) => (later ? 'Solver gap · later GWs' : 'Solver gap · this GW'),
  gapSeg: (g) => (g > 0 ? `${+(g * 100).toFixed(2)}%` : 'Exact'),
  gapNote: 'A looser gap plans faster; the plan may then be that much short of the best.',
  // Settings → Solve ahead (sheets/you.js aheadCtl)
  presolveHead: 'Solve ahead',
  presolveSeg: (on) => (on ? 'On' : 'Off'),
  presolveNote: 'On: what you are likely to tap next, and the next week, is planned before you tap, so it shows at once. Off: Forkcast plans only what you ask for.',
  aheadLocked: 'Options with a lock aren\'t available on this Forkcast.',
  /** A GW past your plan, tapped on the GW switcher (ahead.js edgeTicks): how to plan it, or that its length is locked. */
  weekOff: (gw, n) => `Your plan covers ${COPY.aheadSeg(n)}. To plan GW${gw}, ${COPY.settingsDoor}, then ${COPY.aheadHead}.`,
  weekLocked: (gw) => `GW${gw} is past your plan, and longer plans aren't available on this Forkcast.`,
  hitsUpTo: (n, gw) => `Up to ${MINUS}${E.HIT_COST * n} in GW${gw}`,
  defaultHits: (n, gw) => (num(n) === null ? `When hits pay in GW${gw}` : `Up to ${MINUS}${E.HIT_COST * n} in GW${gw} (default)`),
  /** One name for a hits rule of 0, the retired Auto-plan segment's ("FT only"), on the chip toasts that take it off or
   *  bring it back (ahead.autoRuleName) and its rule chip and note (memory.ruleText). */
  freeOnly: (gw) => `${COPY.segFreeOnly} in GW${gw}`,
  /** A Wildcard or Free Hit week, said over its changes in the Week sheet (ahead.drawWeek; every transfer is free
   *  there). */
  chipWeek: (chip, gw, ftNext = null) => `${chipName(chip)} GW${gw}: ${chipWeekWhat(chip, gw, ftNext)}.`,
  /** A Free Hit or Wildcard week's moves as the squad they make, the week line's second line ("Wildcard +14.7" over "8
   *  changes"). */
  nChanges: (n) => plural(n, 'change'),
  /** A GW tile's struck points, your team's as it is, without your transfers (owner, 2026-10-26): "~~60.0~~ 61.8 xP", a
   *  shop's was-price (ahead.renderRail, tickWas), spoken "60.0 points without your transfers". */
  tileWas: (pts) => `${pts} points without your transfers`,
  /** A bring-in's changes to a Wildcard or Free Hit week's squad, ending its moves line (ahead.inWords): "1 change to
   *  your Free Hit" (not the chip's own "12 transfers, no hit" count). */
  chipChanges: (chip, n) => `${plural(n, 'change')} to your ${chipName(chip)}`,
  /** …and the rule a chip planned there takes off with it (its verdict toast): "Up to −4 in GW6 removed"; the chip
   *  taken off brings it back (ahead.chipOff): "Up to −4 in GW6 back". */
  chipRemoves: (rule) => `${rule} removed`,
  /** A chip planned in a week that played another, as a taken plan's toast names it (ahead.chipWords). */
  inPlaceOf: (what, chip) => `${what} in place of ${chip}`,
  chipBack: (rule) => `${rule} back`,
  /** A week's "FT only" rule described (memory.ruleOf, an older plan's per-week rule read back). */
  gwNote: { free: (gw) => `${COPY.segFreeOnly} in GW${gw}.` },
  /** …the same in a verdict (the edit's toast, a chip's line). */
  hitForbiddenShort: (f) => `the plan takes ${hitsWords(f.hits)} in GW${f.gw} ${f.allowed ? "Forkcast didn't plan for" : "your rules don't allow"}${f.cause === 'relief' ? ' (no plan without it)'
    : f.cause === 'moved' ? ` (planned in ${gwsWords(f.from)}; FPL uses free transfers first)` : ''}`,
  /** The one button that brings him in, under the line naming its moves: Add a player's week; no name on the money
   *  toast's action, which names him already. */
  bringIn: (name, gw) => `Bring in ${name ? `${name} ` : ''}from GW${gw}`,
  /** A Wildcard or Free Hit week's bring-in (ahead.wishPin): him in that week's chip squad, the rest the solver's. */
  bringInChip: (name, gw, chip) => `Bring ${name} into your GW${gw} ${chipName(chip)}`,
  /** Add a player's title, and its footer link with "…". */
  bringInSheet: 'Bring in a player',
  /** Its door at the week line's right end (ahead.js bringDoor). */
  bringInShort: 'Bring in',  /* its "…" a "›" (m-ahead.css .ah-door::after; "…" only a cut word) */
  /** The week line's Chips… door and sheet (ahead.chipsDoor, sheets/chips.js): title, spoken label, the line under the
   *  title (each number's span; the baseline is each row's own: chipNoChip), and each row's name and one fact
   *  (chipStates). */
  chipsDoor: 'Chips',  /* as Bring in's: "›" drawn, FPL's own word */
  chipsIn: (gw) => `Chips in GW${gw}`,
  chipsSaid: (gw, chip = null) => (chip ? `Chips in GW${gw}, ${chipName(chip)} planned` : `Chips in GW${gw}`),
  chipsSub: (gws) => `Points over ${span(gws)}`,
  /** A Chips… row's baseline, in its fact (owner, 2026-10-22: "vs rolling everywhere"): a Wildcard's or Free Hit's its
   *  own (`vs`: rolling), a Bench Boost's or Triple Captain's not playing it (they change no transfer: vs rolling would
   *  fold the week's transfers into it), a swap row's the chip it replaces ("vs it"). */
  chipNoChip: 'not playing it',
  // a row whose chip replaces the week's: its number is against that chip
  chipOn: (c) => `${chipName(c)} ✓`,
  chipByForkcast: 'By Forkcast · Take it off',
  chipMoveHere: (gw) => `In GW${gw} · Move it here`,
  chipInstead: (c) => `Instead of ${chipName(c)}`,
  chipVsIt: 'it',
  chipBestHere: 'Its best week',
  /** …another week's: its number where known (for a Wildcard or Free Hit the pitch's choice that week, `vs` its
   *  baseline), none while that choice is checked. */
  chipBestAt: (gw, delta = null, vs = null) => `Best week: GW${gw}${delta != null ? `\u00a0${fmt.signed(delta)}${vs ? ` ${COPY.chipVs(vs)}` : ''}` : ''}`,
  /** A row's baseline in its fact: "vs rolling", "vs not playing it" (chipNoChip), "vs it" (chipVsIt). */
  chipVs: (vs) => `vs ${vs}`,
  /** The weeks of its half after the plan's last, never looked at, said with a clear best week too (owner, 2026-10-22). */
  chipAfter: (after) => `weeks after GW${after} aren't planned`,
  /** A row's fact and what follows it, joined once (sheets/chips.js factOf). */
  chipFact: (...parts) => parts.filter(Boolean).join(' \u00b7 '),
  /** A Wildcard or Free Hit choice's Why sheet: the chip it spends and when the next one comes (the second half's first
   *  GW: ahead.halfEnd); "Uses your last Free Hit" in the second half. */
  chipUses: (chip, next = null) => (next != null ? `Uses your ${chip}; next one GW${next}` : `Uses your last ${chip}`),
  /** …while its weeks are checked (ahead.chipWait): Add a player's count (planningWeek), its clock after it; no "Best
   *  week" while a week of the span was never asked (`part`; owner, 2026-10-28). */
  chipBestPlanning: (gw, i, n, part = false) => (part ? COPY.planningWeek(gw, i, n) : `Best week · ${COPY.planningWeek(gw, i, n)}`),
  /** …when the best week doesn't beat the runner-up (`next`, its gain `runner`; none in: not playing it) by more than a
   *  toss-up (engine.verdictLabel's 'coin'), and the weeks of its half after the plan's last (`after`) never looked at.
   *  The noise itself is Dev mode's: the words say the toss-up, never its points. */
  chipNoBestName: 'No clear best week',
  /* `bare`: the weeks without their gains (a Wildcard's or Free Hit's row, whose number is vs rolling: those gains are
   *  the pre-solves' against not playing it, which pick its best week). */
  chipNoBest: ({ gw, delta, next, runner }, after = null, bare = false) => `${COPY.chipNoBestName}: GW${gw}${bare ? '' : ` ${fmt.signed(delta)}`} ${next == null
    ? 'is too close to not playing it' : `and GW${next}${bare ? '' : ` ${fmt.signed(runner)}`} are too close to call`}${after != null ? `. ${COPY.chipAfter(after).replace(/^w/, 'W')}` : ''}`,
  chipNoGain: 'No week gains',
  chipPlayed: (gw, back = null) => `Played${gw != null ? ` GW${gw}` : ''}${back != null ? ` · back GW${back}` : ''}`,
  /** Chips…'s row of a chip you played in that week. */
  chipTakeOff: 'Take it off',
  /** …and its wait, verb first (COPY.waitWord, every solve's): Add a
   *  player's "Planning GW7 · 2 of 4 weeks" (week in flight, its place among the weeks needing a solve), clock after it
   *  (ahead.clockText); the Week sheet's suggested plans, "Planning GW8 · 3 of 9 plans" (`of` 'plan'); the week line's
   *  second line the same, "Planning GW8 · 3 of 9" where it doesn't fit (`of` null), "Planning · 3 of 9" where that
   *  doesn't either (`gw` null). */
  planningWeek: (gw, i, n, of = 'week') => `${COPY.waitWord}${gw != null ? ` GW${gw}` : ''} · ${i} of ${of ? plural(n, of) : n}`,
  /** Add a player's line when no week works, as its pills say: every check failed (each "offline": no connection),
   *  every week not possible, else each pill's own reason. */
  weeksUnplanned: (offline) => `Couldn't plan the weeks${offline ? ': no connection' : ''}. Try again in a minute.`,
  noWeekPossible: (gws) => `No plan brings him in during ${span(gws)}.`,
  noWeekWorks: 'No week works: each week above says why.',
  /** FPL's club limit by its own number (engine.MAX_PER_CLUB) and the way out. */
  club: (count, club, gw) => `GW${gw} would have ${count} ${club} players; FPL allows ${E.MAX_PER_CLUB}. Sell one of them first.`,
  /** …as a list row or week pill says it: "3 from ARS". */
  clubFull: (club) => `${E.MAX_PER_CLUB} from ${club}`,
  /** No plan has it, with "Your plan is unchanged." after it. */
  noPlan: (gw) => `No plan fits that from GW${gw}.`,
  unchanged: 'Your plan is unchanged.',
  infeasible: (gw) => `${COPY.noPlan(gw)} ${COPY.unchanged}`,
  /** A heal that can't keep every rule: the rules stay, the plan is the last one that worked. The choice named as its
   *  row says it (ahead.rowName: "Scott → Groß · GW6"); "rule" only for what Your rules lists. */
  rulesClash: (stuck, what, why = null) => `No plan keeps ${stuck ?? 'all your choices'}${what ? ` with “${what}”` : ''}${why ? `: ${why}` : ''}. Your plan is unchanged. Remove one, or Undo.`,
  /** …for an edit that adds no rule (a removal, Reset plan, "Without …"): its own words, then what the rules left can't
   *  keep, as the solver said it (ahead.clashParts): "Calafiori → Hill removed: no plan keeps your GW9 choices (Leno →
   *  Raya and João Pedro → Evanilson). Your plan is unchanged. Remove one, or Undo." */
  dropClash: (said, stuck, why = null) => `${said ? `${said}: no` : 'No'} plan keeps ${stuck ?? 'your other choices'}${why ? `; ${why}` : ''}. Your plan is unchanged. Remove one, or Undo.`,
  /** The week the solver found no plan for and your choices there: "your GW9 choices (Leno → Raya and João Pedro →
   *  Evanilson)". */
  choicesAt: (gw, names) => `your GW${gw} choices (${andList(names)})`,
  /** The Week sheet's status row (its first words the week line's second line) while that failure stands
   *  (ahead.clashLine): what the solve couldn't keep ("Groß in GW6", else all of these) with the choice that broke it
   *  ("Keep Scott · GW6"). Its Removes are on the row; the toast's Undo is gone by then, so the row never offers it. */
  rulesStuck: (what, by, why = null) => `No plan keeps ${what ?? 'all of these'}${by ? ` with ${by}` : ''}${why ? `: ${why}` : ''}. Remove one.`,
  /** Why the week the solver found no plan for has none (api/mobile.py _road_error's `why`: rolling._why_unsolvable,
   *  `short` in £0.1m): "they need 4 transfers in GW9, where 3 are allowed", "they need £0.4m more than you have", or
   *  both; null when nothing lifts it. */
  clashWhy: (why, gw) => {
    const xf = why?.transfers != null ? `${why.transfers} transfers in GW${gw}, where ${why.allowed} are allowed` : null;
    const money = why?.short ? `${fmt.money(why.short / 10)} more than you have` : null;
    return xf || money ? `they need ${xf && money ? `${xf}, and ${money}` : xf || money}` : null;
  },
  unfinished: "Forkcast couldn't finish planning that. Your plan is unchanged.",
  pinClash: (name, keepTo, sellGw) => `Keeping ${name} through GW${keepTo} clashes with selling him in GW${sellGw}. Which one?`,
  /** The journal's notes of a forecast update you kept your plan over (memory writes them). */
  kept: 'New forecast: no change worth making',
  keptLocked: (gw) => `The new forecast changes GW${gw}, which is locked in. Your plan stays`,
  keptOver: 'Kept your plan after a forecast update',
  /** What a new forecast changed in the suggested plan (memory.forecastChange), the week line's second line and a Week
   *  sheet row: GW A's moves in words, then the later weeks' count ("New forecast: GW6 Scott → Le Fée (was Groß) · 2
   *  changes in GW7–9"). */
  newForecast: (A, gwA, later, held = false) => `New forecast${held ? ', best plan' : ''}: ${[gwA ? `GW${A} ${gwA}` : null, later].filter(Boolean).join(' · ')}`,
  /** What a choice takes back of your rules (ahead.takenBack: an alternative, Roll), named as their chips say them
   *  (ruleOf), on the line and in the sheet that asks first alike; taken back = the plan no longer keeps them. */
  altClash: (words) => `${words.join(', ')} removed`,
  removedRules: (n) => `Removed ${n} rule${n === 1 ? '' : 's'}`,
  /** A later week's bank below 0 at FPL's prices (a sale FPL pays £0.1m less for than the solver's data): drift, not an
   *  overspend (the solver keeps every week in budget at its prices); its amount and when it is checked again, never a
   *  bare "≈ price drift". */
  priceDrift: (bank, gw) => `${fmt.money(bank)} at FPL's sale prices · checked again before GW${gw}`,
  /** The price watch (priceWatch): a player's predicted change in a move's line, in FPL's words (priceSaid: "▲ Groß
   *  very likely to rise tonight (+£0.1m to buy)"); what a "very likely" does to the money (half-profit rule on a
   *  sale), or "not counted" without the entry's stepped sale price. A "likely" is never counted and says so ("▲ Groß
   *  may rise tonight (FPL: likely)"): one bracket, never "(FPL: likely) (not counted)". */
  watchPart: (p, when) => `${p.dir > 0 ? '▲' : '▼'} ${p.name} ${priceSaid(p, when)}${!p.sure ? '' : ` (${!p.counted ? 'not counted'
    : p.role === 'buy' ? `${signedMoney(p.step)} to buy` : p.step === 0 ? `sale stays ${fmt.money(p.sale)}` : `sale ${signedMoney(p.step)}`})`}`,
  /** …the first night waiting costs: a move it puts out of reach (this GW's or a later one's) is the call to act before
   *  it (its UK time and the viewer's), in short sentences; money only is a fact, not a call. */
  watchAct: (x) => {
    const lead = `${x.before ? `Waiting past ${x.before} costs nothing. ` : ''}`;
    const make = `${lead}Make ${x.n > 1 ? 'these transfers' : 'it'} before ${x.ref} (${x.clock}). Waiting costs ${fmt.money(x.w)} and`;
    if (x.verdict === 'thisMove') return `${make} leaves you ${fmt.money(x.short)} short. ${x.buys} would be out of reach.`;
    if (x.verdict === 'laterMove') return `${make} GW${x.gw}'s ${x.later} would be ${fmt.money(x.short)} short.`;
    return `${lead}Waiting past ${x.ref} costs ${fmt.money(x.w)}${x.allOk ? '; your moves still fit' : ''}.`;
  },
  /** …the same verdict in one short line, for the week line's second line (ahead.renderLine): the call to act, what
   *  waiting costs, or what it gains. */
  watchShort: (x) => (x.verdict === 'thisMove' || x.verdict === 'laterMove' ? `Make ${x.n > 1 ? 'them' : 'it'} before ${x.ref}`
    // (its price first, never "Waiting": on the strip it read as the app's own wait)
    : x.w > EPS ? `${x.ref[0].toUpperCase()}${x.ref.slice(1)} costs ${fmt.money(x.w)}` : `No rush: waiting gains ${fmt.money(-x.w)}`),
  /** …no night costs: waiting gains money (a sale that rises, a buy that drops), or changes nothing a move costs. */
  watchGain: (w, ref) => `No rush: waiting past ${ref} gains ${fmt.money(w)}.`,
  watchFree: (n) => `No cost to wait: the price changes leave ${n > 1 ? 'these transfers' : 'this transfer'} as it is.`,
  /** …how old FPL's reading is, the line's quiet tail: FPL refreshes it about every 15 minutes, the server reads it
   *  every 30, every 10 in the 3 h before a change (the bundle's prices block and meta.prices_as_of, else the
   *  snapshot's); "early" when read 8 h or more before the change. */
  watchNote: (asOf, old) => `as of ${asOf}${old ? ', early' : ''}`,
  /** …put away until its verdict changes, and the morning after its night (priceMorning): what the night did to the
   *  counted players' prices and GW A's bank. The button says what it does, "Hide" (its spoken label's verb). */
  watchWait: 'Hide',
  /** Add a player's row for one of week g's squad (sheets/wish.js): "In your team" when he is in your FPL team now,
   *  else only the plan buys him by then. */
  inYours: (inTeam, gw) => (inTeam ? 'In your team' : `In your GW${gw} plan`),
  /** GW A's countdown as VoiceOver says it (ahead.deadlineInfo's `said`): its two largest parts in words, the visible
   *  text unchanged. */
  leftSaid: (d, hr, m, s) => `${d ? `${plural(d, 'day')} ${plural(hr, 'hour')}` : hr ? `${plural(hr, 'hour')} ${plural(m, 'minute')}` : `${plural(m, 'minute')} ${plural(s, 'second')}`} left`,
  watchWaitSaid: 'Hide the price watch until it changes',
  watchMorning: (moved, gw, bank) => (!moved.length ? 'Prices held overnight'
    : `${andList(moved.map((x, i) => `${x.name} ${x.t > 0 ? 'rose' : 'dropped'}${i ? '' : ' overnight'} (${signedMoney(x.t)})`))}${bank == null ? ''
      : bank < -EPS ? `: ${fmt.money(-bank)} short now` : `: your GW${gw} moves still fit`}`),
  /** An older plan's frozen week as plan memory still reads one (Freeze is gone: normalizeAccepted thaws them, so it is
   *  never said). */
  frozenEdit: (gw, at = null) => `GW${gw} is frozen${at ? ` (${at})` : ''}.`,
  /** You → Reset plan (ahead.resetPlan): the toast, with Undo. */
  planReset: 'Plan reset: your team as it is, no rules or transfers of yours.',
  /** The pitch's Reset plan pill, as VoiceOver names it: what ahead.resetPlan resets (memory.reset: your document as a
   *  new team's, Settings → Hits with it; this browser's later lineups). */
  resetAll: 'Reset all weeks',
  planResetSaid: 'Reset all weeks: take off every transfer, chip, rule and lineup of yours, and set Hits back to its default',
  /** The pitch's one Reset where your viewed GW's lineup and your plan both have something to take back (owner,
   *  2026-10-29: top-left corner): its words "Reset ⌄", as VoiceOver names it, and its choice sheet, each row what it
   *  takes back (planResetSaid's words for the plan). */
  resetSaid: (g) => `Reset: your GW${g} lineup or your whole plan`,
  resetTitle: 'Reset',
  resetLineupName: (g) => `Reset GW${g} lineup`,
  resetLineupWhat: (g) => `The plan's best lineup in GW${g} again; your transfers stay`,
  resetPlanWhat: 'Every transfer, chip, rule and lineup of yours off; Hits back to its default',
  /** Back after FORGET_MS away: signed out, its choices gone (app.js signOut away). */
  awaySignedOut: (name) => `Signed out of ${name} after ${AWAY} away; its choices are cleared.`,
  /** The suggested plans' label, once (the Week sheet's plans heading and the pitch's hidden choices heading; `lead`
   *  plansHead; uppercase by CSS): rows come best first once none still checks, said by no tag; the weeks its numbers
   *  count (gws: valuedOver), "Suggested plans · GW8–9"; then what they count against, `vsPlan` planVs's words ("· vs
   *  no transfers", "· vs your plan"; true / false say "your plan" / "rolling"). Closed: "Suggested plans" alone
   *  (owner, 2026-10-13). */
  // (`short`: fewer weeks than the plan's window, said so, "GW12–13 only": review 7, 2026-11-02, a GW12 +1.3 next to a
  // GW10 +1.2 counts fewer weeks)
  suggested: (gws = null, vsPlan = null, lead = 'Suggested', short = false) => `${lead}${gws?.length ? ` · ${COPY.valuedOver(gws)}${short ? ' only' : ''}` : ''}${vsPlan === null ? '' : ` · vs ${typeof vsPlan === 'string' ? vsPlan : vsPlan ? 'your plan' : 'rolling'}`}`,
  /** The suggested plans (owner, 2026-10-11): each week's choices (ahead.plansOf) under "Suggested plans", ranked by
   *  their numbers, each against rolling (the Roll row, no number); a row is the week's own moves alone ("GW7 Kayode →
   *  Vuskovic", none: "GW7 roll"; the + takes this week only: planTake) and its number; on the pitch, a place's "⋯ N
   *  more" (placeMore) for the choices it has no room for. A choice whose solve failed keeps its row, no number, with
   *  why (planFailed; a solve that found no plan keeping your rules says so, not "couldn't plan"). */
  plansHead: 'Suggested plans',
  planRoll: (g) => (g == null ? 'Roll' : `GW${g} roll`),
  /** A plan row's + and its Why sheet's button: "Take GW7 Scott → Dewsbury-Hall" (its week alone: ahead.planTake). */
  planTake: (head) => `Take ${head}`,
  /** …its toast's action before Undo (ahead.addPlan, every way a choice is taken; owner, 2026-10-21): the transfer's
   *  Why sheet, as a tap on his IN card opens it. */
  whyAct: 'Why',
  /** In a week with transfers of yours a plan row draws only what it adds, then what its + takes back of yours: "GW7
   *  Scott → Dewsbury-Hall instead of Scott → Xhaka", "GW7 roll instead of Scott → Xhaka"; one that only drops some,
   *  "GW7 without Saka → Palmer". */
  planInsteadOf: (moves) => `instead of ${moves}`,
  planWithout: (moves) => `without ${moves}`,
  /** Why a plan's moves go together, read off its solved road (ahead.openPlanWhy): "Neto's sale makes room: Palmer is
   *  your 3rd CHE player". */
  planRoom: (sold, buy, n, club) => `${sold}'s sale makes room: ${buy} is your ${fmt.ordinal(n)} ${club} player`,
  planFailed: (why) => ({ offline: "can't plan it offline", nofit: 'Forkcast found no plan that keeps your other weeks', infeasible: 'no plan keeps your rules with it' }[why]
    ?? "Forkcast couldn't plan it, trying again soon"),
  /** A choice whose solve failed, under its card in a player's place (the Week sheet's row says planFailed in full). */
  planFailedShort: (why) => ({ offline: 'offline', nofit: 'no plan fits', infeasible: 'breaks your rules' }[why] ?? "couldn't plan"),
  /** The card behind (ahead.renderDecks; owner, 2026-10-20): a pair's second tab, a player's place (its stack's label,
   *  header, notes, bar), the week's Roll locked beside the goal. A choice of several moves lit on several tabs: each
   *  tab its part mark, "1/3" (the main), "2/3", "3/3" (owner, 2026-10-22), read "part 2 of a 3-transfer plan, +5.8
   *  points vs rolling", never as that one player's sale. */
  placeOf: (name) => `Replace ${name}`,
  /** The marks on the pitch (ahead.renderDecks; owner, 2026-10-23; forkcast/studies/design_marks/DECISION.md): a take's words,
   *  "Swap", "Swap both", "Swap all 3", spoken by a place's card ("Swap both: …", swapSaid; the pitch's plates take
   *  nothing: owner, 2026-10-25); a move said "Kayode out, Truffert in"; the best plate's label, "Best this week: …"; a
   *  plan's tag in another row, never its number twice; a place's first choice's plate where nothing there beats
   *  rolling, or your plan in a week of yours (placeNoneSaid's `vs`). */
  swapGo: (n) => (n > 2 ? `Swap all ${n}` : n === 2 ? 'Swap both' : 'Swap'),
  /** A plan's plate over its sellers in one row, the buys of its sellers in other rows counted (owner, 2026-10-25):
   *  "Rice & 2 more +5.0 xP Swap all 3"; each of those keeps his ring and his tag. */
  planMore: (n) => `& ${n} more`,
  swapSaid: (pairs, num = null) => `${COPY.swapGo(pairs.length)}: ${pairs.map(([o, i]) => `${o} for ${i}`).join(', ')}${num ? `, ${num}` : ''}`,
  moveSaid: (out, inn) => `${out} out, ${inn} in`,
  // (`move`: the best move beside a chip's token, the week's best: never two "Best this week"; owner, 2026-10-25)
  bestSaid: (moves, num, move = false) => `Best ${move ? 'move ' : ''}this week: ${moves.length > 1 ? `${moves.length} transfers, ${num}: ${moves.join('; ')}` : `${moves[0]}, ${num}`}`,
  partSaid: (mine, others, move = false) => `Part of the best ${move ? 'move ' : ''}this week: ${mine}${others.length ? `, with ${others.join('; ')}` : ''}`,
  placeNoneSaid: (name, n, vs = null) => `${name}: ${plural(n, 'choice')} for his place, none better than ${vs ?? 'rolling'}. Shows ${n === 1 ? 'it' : 'them'}`,
  placeSwap: 'Swap',
  /** A take's one word wherever it is drawn (owner, 2026-10-28): "Swap" ("Swap both", "Swap all 3") for its transfers,
   *  "Roll" for a Roll, "Take" for a chip alone; on the place's header and line, the best move's ink token, the Week
   *  sheet's row and the Why sheet's button. */
  takeWord: (n, chip = false) => (n ? COPY.swapGo(n) : chip ? 'Take' : 'Roll'),
  /** The week's best move as a token beside the goal, first in its stack (ahead.tokensOf; owner, 2026-10-26):
   *  "Evanilson +1.6", said "Best move this week: …, shows his choices". */
  showsChoices: 'shows his choices',
  /** Who a take's re-picked lineup benches (ahead lineupMoved). */
  toBench: (names) => `${names.join(', ')} to bench`,
  /** The header's total's change after an edit, named apart from a week's "vs rolling" (renderTotal). */
  totalChange: 'total',
  /** …a chip's token while the Why sheet is hidden (ahead WHY_SHEET): it opens the Week sheet, its row's + plays it. */
  showsWeek: 'shows the week\'s plans',
  /** The week's runner-up token's name (ahead.js tokensOf; the owner, 2026-10-29), as bestSaid says the best's. */
  nextSaid: (moves, num) => `Next best this week: ${moves.length > 1 ? `${moves.length} transfers, ${num}: ${moves.join('; ')}` : `${moves[0]}, ${num}`}`,
  /** …a multi-move best's plate: it opens that plan's Why sheet, whose one button takes it. */
  showsWhy: 'Shows why',
  /** The best token's spoken name where its tap takes (ahead.tokensOf): its visible verb first. */
  bestSwapSaid: (said) => `Swap. ${said}`,
  /** His card's chip spoken (priceProgress): "Predicted progress +26.4%". */
  progressSaid: (text) => `Predicted progress ${text}`,
  /** The £↓ beside it, where a drop takes your sale down as well, and it spoken, step in tenths: "sale −£0.1m". */
  saleDrops: '£↓',
  saleSaid: (step) => `sale ${signedMoney(step)}`,
  /** A buy of yours's plate (ahead.swapPlate; owner, 2026-10-26): the player you sold, said "Keep Gabriel, not Justin,
   *  +0.8 points vs your plan". */
  keepSoldSaid: (sold, buy) => `Keep ${sold}, not ${buy}`,
  /** The ✕ on the best move's token (ahead.js renderDecks; owner, 2026-11-02): its buy refused in this week alone. */
  notBuySaid: (buy, g) => `Not ${buy} in GW${g}: the next best move`,
  /** A pair card's note, its other moves (ahead.noteOf): "also Semenyo → Palmer, Cunha → Rice". */
  placeAlso: (moves) => `also ${moves.join(', ')}`,
  placeChoices: (n) => `${plural(n, 'choice')} for his place ›`,
  placeInstead: 'What could go there instead',  // a row to his place, its › drawn (.m-nav)
  placeSaid: (name, n, best) => `${name}: ${plural(n, 'choice')} for his place${best ? `, best ${best}` : ''}. Shows them`,
  placeNow: 'Now',
  placeYours: 'Yours',
  placeRemove: 'Remove',
  placeKeep: 'Keep',
  /** The veto on the card of a player you don't have (sheets/player.js ruledSeg), "Not", as the rule chip ("Not Groß ·
   *  GW8") and the swipe say it. */
  placeKeepSaid: (name, g) => `Keep ${name} in GW${g}: no transfer sells him`,
  // a card's corner marks (ahead renderDecks: cardMarks): × his place, the lock a GW Keep of him (owner, 2026-11-02)
  cardOutSaid: (name, g) => `Replace ${name} in GW${g}: his choices`,
  cardNoBuy: (name, g) => `No buy fits ${name}'s money in GW${g}`,
  cardLockSaid: (name, g, on) => (on ? `${name} kept in GW${g}. Unlock` : `Lock ${name} in GW${g}: no transfer sells him`),
  /** A Keep that leaves your plan as it is (ahead.keep), from his place or his card's Force keep, whichever Keep of his
   *  it remakes: what it changed, the suggestions. */
  keptFromChoices: (name, when) => `${name} kept${when}: suggestions won't sell him`,
  keepIn: (name, g) => `Keep ${name} in GW${g}`,
  placeRemoveSaid: (out, inn) => `Remove ${out} to ${inn} from your plan`,
  placeCantPlan: "can't plan",
  /** A move of a pair the week can't make alone (ahead.plansOf `needs`): the pair's sales that make it fit, "needs
   *  Kayode's sale" (its card's note in his place; its Week sheet row and spoken line after what it lacks alone,
   *  ahead.problemShort's "£1.2m short"). */
  needsSale: (names) => `needs ${andList(names.map((n) => `${n}'s`))} ${names.length > 1 ? 'sales' : 'sale'}`,
  placeNth: (n) => `a ${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 > 3 ? 0 : n % 10]} transfer`,
  placeMore: (n) => `${n} more ›`,  // "⋯" is a row's menu (Bring in's, his card); a next page reads as the bar's ›
  /** A place's last slot (ahead.drawPlace; owner, 2026-10-27): Bring in… at his position, for a player its cards don't
   *  offer. */
  placeOther: 'Bring in…',
  placeOtherSaid: (name, gw) => `Other players for ${name}'s place: Bring in… in GW${gw}`,
  placeAll: (n) => `All ${n} choices`,
  placeAt: (i, n) => `${i} of ${n}`,
  /** …its bar's second line: what its numbers are, "Gain vs rolling · GW8–11" (owner, 2026-10-22); while what they
   *  count against is still checked (ahead.plansVs null), its weeks alone. */
  placeNumbers: (vs, gws) => `${vs ? `Gain vs ${vs} · ` : ''}${span(gws)}`,
  /** Your Roll, the week's status beside the goal (ahead.emptyHead, statusTok), alone: no "until you take a move" under
   *  it (owner, 2026-10-26). */
  rollingOn: 'Rolling ✓',
  /** The week's status beside the goal (ahead.statusTok; owner, 2026-10-26): its words, then where its tap goes,
   *  "Rolling; opens GW9 transfers". */
  statusSaid: (said, g) => `${said}; opens ${COPY.weekTitle(g)}`,
  /** The Roll row's Why sheet in a week you roll: nothing to take, so no Take there (owner, 2026-10-22: "+" only where
   *  it would change something). */
  rollAlready: (g) => `Your plan makes no transfer in GW${g} already`,
  /** A roll's Why sheet: the free transfers rolling leads to, "4 FT in GW9" (rollKeeps), at FPL's cap (engine.nextFt
   *  adds none) that it adds none. */
  rollCapped: (ft, gw) => `${ft} FT already, the most: rolling adds none in GW${gw}`,
  /** A move's Why sheet: the next GW's free transfers in the plan you have, then without the move (ahead.whyFacts):
   *  "GW9: 3 FT, not 4". */
  /** …the sub of a move's Why sheet in a week of two or more transfers, which has no number of its own (owner,
   *  2026-10-22: no row numbers). */
  whyOneOf: (gw, n) => `GW${gw} · one of ${n} transfers: the week's number is on its line`,
  ftWithout: (gw, ft, without, n = 1) => `GW${gw}: ${ft} FT (${without} without ${n > 1 ? `these ${n} transfers` : 'this transfer'})`,
  /** …on the pitch the week's status beside the goal (ahead.emptyHead, statusTok), its Week sheet row with no + either. */
  noTransferMade: 'No transfer made',
  /** The strip's answer, in every week you can change (owner, 2026-11-05, design_1105b A, "like save more"): Forkcast's move
   *  under its title, a week it saves, or your moves with nothing to add. */
  answerMove: 'Make this transfer',
  /** The suggestion card's green button, at its right: FPL's word for the act, the one the card, its header and its
   *  take-back say ("Swap" beside "1 transfer made" and "Save your free transfer"; card audit 2026-11-10). */
  swap: 'Transfer',
  showAnother: 'Show another',
  showATransfer: 'Show a transfer',
  /** The card's take-backs, each saying what it takes back (owner, 2026-11-05, "fix undo / reset buttions signs and theier
   *  meaning and wording"): this week's transfers, or the card before your Show another. */
  undoSwaps: (n) => (n === 1 ? 'Undo transfer' : `Undo ${n} transfers`),
  previous: 'Previous',
  undoLast: 'Undo',
  seeChanges: 'See the changes',
  onToWeek: (g) => `On to GW${g}`,
  showSuggestion: 'Show suggestion',
  /** The card's one number's words, at its left (owner, 2026-11-09, design_1109a slip): the move's points over the weeks
   *  shown against `vs`, what it counts against (card audit 2026-11-10: "vs saving it for later" named no "it", and on a
   *  pay-back saving was no choice): vsSaving where a free transfer is left to save, else planVs's. */
  vsNext: (n, vs) => `${n === 1 ? 'Next week' : `Next ${n} weeks`}, vs ${vs}`,
  vsSaving: 'saving a free transfer',
  /** The week card's Bring in: one of its two buttons, or its links row's door where both are taken (screen-ticket.js). */
  bringInPlayer: 'Bring in a player',
  offForNow: '(off for now)',
  /** The card while the pitch asks who he replaces (design_1109a slip): "B.Fernandes → ?", the ask under it. */
  bringWho: (name) => `${name} → ?`,
  /** A sub's pick on the pitch (buys.chooseSub): a bench player chosen asks who he comes on for, a starter who comes on
   *  for him. */
  subWho: (name, on) => `${name} ${on ? 'on' : 'off'} for ?`,
  subTap: 'Tap the player he swaps with',
  bringTap: 'Tap the player he replaces',
  bringCancel: 'Cancel',
  /** A place on the pitch the card's swap would change, said. */
  boardSaid: (name, out) => `${name} would come in for ${out}`,
  boardBench: (name) => `${name} would go to the bench`,
  playAChip: 'Play a chip',
  yourFplTeam: 'Your FPL team:',
  answerSave: (ft) => (ft > 1 ? 'Save your free transfers' : 'Save your free transfer'),
  answerDone: 'Nothing more to do this week',
  /** The band's number's scope and its toss-up (ahead tokensOf; owner, 2026-11-03, design_1103b): "· 4 GW", "Close call". */
  overGws: (n) => `· ${n} GW`,
  closeCall: 'Close call',
  /** A lineup of yours that leaves a suggested buy on your bench (the buy takes the slot of the player he replaces:
   *  ahead.asTaken), said in the lineup edit's toast and in his place's bar: "Palmer would start on your bench". */
  onYourBench: (names) => `${andList(names)} would start on your bench`,
  /** …and a Wildcard or Free Hit it lowers or takes off the pitch (its squad played in your lineup's places). */
  chipLineup: (chip, g) => `${chip} counted with your GW${g} lineup`,
  /** What a plan counts against, said on its heading, row and Why sheet ("· vs no transfers": your team as it is, every
   *  week rolled; "· vs your plan" once your plan has a transfer in any week), and its Why sheet's two sides. */
  planVs: (mine = false) => (mine ? 'your plan' : 'no transfers'),
  /** The ?solves=1 panel's words for your plan's solve with nothing of yours added (memory/live-heal.js runHeal). */
  healNone: 'no transfers added',
  /** Under the hold a plan counts against rolling (ahead.plansOf; owner, 2026-10-19: "Gain over rolling"): its row,
   *  heading and Why sheet say so; the Roll row is what they count against (spoken, no number); a +'s toast says no
   *  number (owner, 2026-10-27), nor a × that rolls the week again; what your total moves by is the header's change,
   *  and the Why sheet says it where that differs (planAdds, totalMoved). */
  planVsRoll: 'rolling',
  planRefSaid: 'what the plans count against',
  planAdds: (delta) => `Your total: ${pts(delta)} when you take it`,
  /** A taken move's Why sheet, under its number vs rolling where your total moved by another amount: what that total
   *  counts it against, in the plans' words (planVs: "no transfers", "your plan"). One line: the take's toast says the
   *  number alone. */
  totalMoved: (delta, mine = false) => `Your total moved ${pts(delta)}: vs ${mine ? 'your plan without it' : COPY.planVs(false)}, not vs rolling`,
  /** A choice's Why sheet, what its number counts after its week (ahead.countedAfter): its head, the roll's plan named,
   *  and a plan's line, "Rolling: GW9 Saka → Palmer · GW11 Rice → Wirtz", one that makes no later move "no transfers". */
  countedAfter: (g) => `Counted after GW${g}`,
  countedRoll: 'Rolling',
  countedLine: (name, weeks) => `${name}: ${weeks.length ? weeks.join(' · ') : 'no transfers'}`,
  /** A Wildcard or Free Hit choice's Why sheet, its changes (ahead.squadChanges): a player a Keep of yours holds in its
   *  squad. */
  keptRule: 'kept: your rule',
  /** A plan row's + in your Wildcard or Free Hit week whose choice plays none: the chip off. */
  chipTakenOff: (chip, gw) => `${chip} in GW${gw} taken off`,
  /** The week line's words (ahead.renderLine; owner, 2026-10-19: one line above the pitch, your transfers on it as IN
   *  cards): how many more notices than the one it shows; GW A under way (the head every live sentence starts with);
   *  your week's transfers, "1 transfer" over "Out: Saka"; its sheet's title, "GW8 transfers". */
  moreNotices: (n) => ` · +${n}`,
  /** GW A's lineup on the pitch where it differs from the one set in FPL (ahead.fplSets): the week line's notice names
   *  whom to start (setsSaid); its Week sheet row says only what is true (FPL's team is the last deadline's): the GW
   *  that team is for, what it did and each change that makes this pitch, a step a line (setsRow): "Your FPL team for
   *  GW7 benched Justin and Barry. To match this pitch in FPL:" over "Start Justin for Gvardiol", "Captain: Saka"; the
   *  week line its one change, else how many ("Set in FPL: 3 changes"). */
  setInFpl: (sets) => { const n = setsRow(sets)[1].length; return `Set in FPL: ${n > 1 ? COPY.nChanges(n) : setsSaid(sets)}`; },
  /** …→ [lead, [step]]: the row's sentence and its steps (ahead.noteRow draws them a line each). */
  setInFplRow: (sets) => {
    const [had, steps] = setsRow(sets);
    return [`Your FPL team${sets.gw ? ` for GW${sets.gw}` : ''} ${had ?? 'differs from this pitch'}. To match this pitch in FPL:`, steps];
  },
  /** …its words alone where the bar's line has no room for what to set (whole, never "Set in FPL: 2 ch…"; the Week
   *  sheet's row says what). */
  // (a to-do, never a status: review 7, 2026-11-02)
  setInFplShort: 'To set in FPL',
  liveHead: (gw) => `GW${gw} is live`,
  nTransfers: (n) => plural(n, 'transfer'),
  /** A take's toast where the week keeps transfers of yours beside its own (ahead.addPlan): the week's count its number
   *  belongs to, "3 transfers in GW8". */
  weekTransfers: (n, gw) => `${plural(n, 'transfer')} in GW${gw}`,
  outNames: (names) => `Out: ${names.join(', ')}`,
  // ("plan" named the week, the suggestions, the whole and the horizon)
  weekTitle: (gw) => `GW${gw} transfers`,
  rulesHead: 'Your rules',
  /** A player's name in a Why sheet's comparison, said as what it opens. */
  cardOf: (name) => `${name}'s card`,
  /** Two players side by side (sheets/player.js), said: the first against the second. */
  compareOf: (a, b) => `${a} against ${b}`,
  /** Its name menus' spoken label. */
  comparePick: (name) => `Compare instead of ${name}`,
  /** A row's button in that list. */
  compareGo: 'Compare',
  /** The card's link under its line: its one transfer's two players side by side, else any two (its first list's title). */
  comparePlayers: 'Compare players',
  /** Its second list's title. */
  compareWith: (name) => `Compare with ${name}`,
  /** A suggested plan while it is solved (on its row): no number guessed, only what it waits for: "planning…" its own
   *  solve (also the week line's while its transfers' plans solve), "waiting" the slot (a sheet's solve, a refused
   *  ask), "waiting for your edit's plan". */
  waitShort: 'planning…',
  pairWaiting: 'waiting',
  pairAfterEdit: 'waiting for your edit\'s plan',
  /** A new GW's one notice (memory.carryOver, said once by Ahead): what the last GW's plan handed on (your rules as
   *  their chips); '' with none. */
  carried: (from, what) => (what.length ? `Carried over from GW${from}: ${what.join(', ')}.` : ''),
  /** In a sentence the whole number, to the thousand ("≈" says it is rounded; a rate under 1,000, at the top ranks, as
   *  it is, never "0 places"): "At your rank, 1 pt ≈ 80,000 places (GW5 standings)." */
  exchange: (placesPerPt, source) => `At your rank, 1 pt ≈ ${fmt.int(Math.abs(placesPerPt) >= 1e3 ? Math.round(placesPerPt / 1e3) * 1e3 : placesPerPt)} places (${source}).`,
  /** The line every GW (owner, 2026-10-21): the bundle's rank.cheer (api/cheer.py: {gw, rank, best, at}: last season's
   *  best final rank among the managers ranked at or below yours after the same GW, `at` that manager's rank then),
   *  ranks as the You tile has them: "Last season a manager ranked 1.80M after GW7, below your 1.30M, finished 29th.";
   *  "just below you" where the two read alike. */
  cheerLine: (c) => {
    const at = rankShort(c.at ?? c.rank), mine = rankShort(c.rank);
    return `Last season a manager ranked ${at} after GW${c.gw}, ${at === mine ? 'just below you' : `below your ${mine}`}, finished ${rankOrd(c.best)}.`;
  },
  /** While it plans (waitFacts; owner, 2026-10-27): two true lines about you, each [before, its number, after] (the
   *  number bold). Your rank before and after the last GW FPL has checked: "GW8 took you from 1.30M to **670K**
   *  overall."; the line every GW in 11 words: "Last season a manager ranked below you after GW8 finished **29th**."
   *  ("like you" where the two ranks read alike). */
  factMove: (gw, from, to) => (rankShort(from) === rankShort(to) ? [`GW${gw} kept you at `, rankShort(to), ' overall.']
    : [`GW${gw} took you from ${rankShort(from)} to `, rankShort(to), ' overall.']),
  factRank: (c) => [`Last season a manager ranked ${rankShort(c.at ?? c.rank) === rankShort(c.rank) ? 'like' : 'below'} you after GW${c.gw} finished `, rankOrd(c.best), '.'],
  /** What the points on screen are (the bundle's meta.scale {k, k_h, seasons}: the plan service puts every forecast
   *  number on the real-points scale, by horizon when k_h is there; a hit is FPL's −4 as it is). */
  realScale: (s) => {
    const lo = Math.min(...s.seasons), hi = Math.max(...s.seasons);
    const kh = Array.isArray(s.k_h) && s.k_h.length > 1 ? s.k_h.map(Number) : null;
    const x = (k) => `×${k.toFixed(2)}`, n = kh ? kh.length - 1 : 0;
    const by = kh ? `${x(kh[0])} this week up to ${x(kh[n])} ${WORDS[n] ?? n} week${n === 1 ? '' : 's'} ahead` : x(Number(s.k));
    return `Points shown ≈ real points: the forecast ${by} (actual per forecast point, ${lo === hi ? lo : `${lo}–${hi}`}).`;
  },
  forecastEdge: (gw) => `The forecast stops at GW${gw}.`,
  /** The quiet note while the plan on screen is a saved copy (the server away). */
  offline: (time) => `Offline · data from ${time}`,
  updating: 'The forecast is updating. Your plan refreshes in a minute.',
  preseason: 'No deadline coming up. Plans start before GW1.',
  // GW A under way says only what is true: what FPL published against your plan (liveCheck), or the next plan, which
  // starts the moment FPL publishes your GW A team (api/mobile.py live_week: the bundle moves to GW A+1)
  live: (gw) => `${COPY.liveHead(gw)}. Forkcast plans from GW${gw + 1} once FPL publishes your GW${gw} team.`,
  liveMatch: (gw) => `${COPY.liveHead(gw)}. Your FPL team matches your plan.`,
  liveDiff: (gw, fpl, plan) => `${COPY.liveHead(gw)}. FPL has ${andList(fpl)} where your plan had ${andList(plan)}.`,
});

/** GW A under way, the 15 FPL published for it (the bundle's entry.published, never the entry's own picks) against GW
 *  A's week as the plan has it (a ViewWeek), squad only (start / bench and the armband are spoken only): the same 15,
 *  FPL's players the plan hasn't paired by position with the plan's (engine.pairMoves), or COPY.live while FPL has
 *  published none (once it does, the bundle plans from the GW after). */
export function liveCheck(published, week, L) {
  const fpl = published?.gw === week.gw ? ids([...(published.xi || []), ...(published.bench || [])]) : [];
  if (!fpl.length) return COPY.live(week.gw);
  const pairs = E.pairMoves(week.squad.filter((p) => !fpl.includes(p)), fpl.filter((p) => !week.squad.includes(p)), L);
  if (!pairs.length) return COPY.liveMatch(week.gw);
  const names = (k) => pairs.map((m) => m[k]).filter((p) => p != null).map((p) => L.name(p));
  return COPY.liveDiff(week.gw, names('in'), names('out'));
}

