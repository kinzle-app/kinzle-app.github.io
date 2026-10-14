// Pocit ze hry: všechny časy (ms) a intenzity animací, zvuků a vibrací na jednom místě.

export const FEEL = {
  // kostička
  tilePress: 80,             // zamáčknutí při výběru
  tileRelease: 120,          // povolení při zrušení výběru (o něco měkčí)

  // vibrace (ms nebo vzor [vibrace, pauza, vibrace…]); na iOS se tiše nic nestane
  vibrate: {
    select: 8,
    deselect: 4,
    wrong: [35, 50, 35],
    oneAway: [20, 40, 20],
    correct: [12, 30, 18]
  },

  // chyba: zatřesení vybraných kostiček
  shake: { duration: 380, distance: 7 },
  // „těsně vedle“: přátelské poskočení místo třesení
  oneAway: { duration: 520, height: 8 },

  // správná skupina
  solve: {
    lift: 110,               // kostičky se jedna po druhé nadzvednou
    stagger: 70,             // odstup mezi kostičkami
    gather: 280,             // sletění k sobě
    bar: 320,                // vyjetí pruhu skupiny
    noteDelay: 120           // vysvětlení se ukáže až po pruhu
  },

  revealDelay: 800,          // po prohře: odstup mezi odkrývanými skupinami
  message: 2500,             // jak dlouho svítí hláška

  // výhra
  scoreCountUp: 1100,        // body naskakují
  confetti: { pieces: 70, duration: 2600 },

  // zvuky
  volume: 0.22
};
