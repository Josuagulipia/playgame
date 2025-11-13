(() => {
  const p1Pool = document.getElementById("p1-pool");
  const p2Pool = document.getElementById("p2-pool");
  const p1Sorted = document.getElementById("p1-sorted");
  const p2Sorted = document.getElementById("p2-sorted");
  const p1Next = document.getElementById("p1-next");
  const p2Next = document.getElementById("p2-next");
  const p1Time = document.getElementById("p1-time");
  const p2Time = document.getElementById("p2-time");
  const p1Penalty = document.getElementById("p1-penalty");
  const p2Penalty = document.getElementById("p2-penalty");
  const message = document.getElementById("message");
  const winnerEl = document.getElementById("winner");
  const newBtn = document.getElementById("newBtn");
  const countSelect = document.getElementById("countSelect");

  const penaltySec = 2;
  let timer = null;
  let winnerDeclared = false;

  const state = {
    p1: {
      pool: [],
      sorted: [],
      start: null,
      penalty: 0,
      running: false,
      endTime: null,
    },
    p2: {
      pool: [],
      sorted: [],
      start: null,
      penalty: 0,
      running: false,
      endTime: null,
    },
  };

  // helpers
  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // generate unique random numbers 1..99
  function randomNumbers(n) {
    const set = new Set();
    while (set.size < n) {
      set.add(Math.floor(Math.random() * 99) + 1);
    }
    return Array.from(set);
  }

  function renderPool(player, container) {
    container.innerHTML = "";
    const st = state[player];
    st.pool.forEach((n) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = n;
      tile.dataset.value = n;
      // click & touch
      tile.addEventListener("click", () => handleClick(player, n, tile));
      tile.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          handleClick(player, n, tile);
        },
        { passive: false }
      );
      container.appendChild(tile);
    });
  }

  function handleClick(player, val, el) {
    const st = state[player];
    if (!st.running || winnerDeclared) return;
    // expected = smallest remaining number
    const remaining = st.pool.filter((x) => !st.sorted.includes(x));
    if (remaining.length === 0) return;
    const expected = Math.min(...remaining);
    if (Number(val) === expected) {
      // correct
      st.sorted.push(Number(val));
      // hide source tile visually
      el.classList.add("hidden");
      // add to sorted area
      const targetSorted = player === "p1" ? p1Sorted : p2Sorted;
      if (st.sorted.length === 1) targetSorted.innerHTML = "";
      const copy = document.createElement("div");
      copy.className = "tile correct";
      copy.textContent = val;
      targetSorted.appendChild(copy);
      updateNext(player);
      // finished?
      if (st.sorted.length === st.pool.length) {
        finish(player);
      }
    } else {
      // wrong
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 260 }
      );
      st.penalty += penaltySec;
      updatePenalty(player);
      message.textContent = `Player ${
        player === "p1" ? "1" : "2"
      } salah! +${penaltySec}s penalti`;
    }
  }

  function updateNext(player) {
    const st = state[player];
    const rem = st.pool.filter((x) => !st.sorted.includes(x));
    const next = rem.length ? Math.min(...rem) : "Selesai";
    if (player === "p1") p1Next.textContent = next;
    else p2Next.textContent = next;
  }

  function updatePenalty(player) {
    if (player === "p1") p1Penalty.textContent = state.p1.penalty;
    else p2Penalty.textContent = state.p2.penalty;
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      ["p1", "p2"].forEach((pl) => {
        const s = state[pl];
        if (s.running) {
          const t = (Date.now() - s.start) / 1000 + s.penalty;
          if (pl === "p1") p1Time.textContent = t.toFixed(1);
          else p2Time.textContent = t.toFixed(1);
        }
      });
    }, 100);
  }

  function stopTimerIfNeeded() {
    if (!state.p1.running && !state.p2.running && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function finish(player) {
    const st = state[player];
    st.running = false;
    st.endTime = (Date.now() - st.start) / 1000 + st.penalty;
    message.textContent = `Player ${
      player === "p1" ? "1" : "2"
    } selesai — Waktu: ${st.endTime.toFixed(2)}s`;
    // If winner already declared, do nothing further.
    if (winnerDeclared) {
      stopTimerIfNeeded();
      return;
    }
    const otherKey = player === "p1" ? "p2" : "p1";
    const other = state[otherKey];
    // If other still running -> current player finished first => immediate winner
    if (other.running) {
      announceWinner(player, st.endTime);
    } else {
      // other already finished earlier => compare times (note: other.endTime should exist)
      if (other.endTime != null) {
        if (st.endTime < other.endTime) announceWinner(player, st.endTime);
        else if (st.endTime > other.endTime)
          announceWinner(otherKey, other.endTime);
        else announceTie(st.endTime); // exactly same time (rare)
      } else {
        // other not running but no endTime (shouldn't happen) -> declare current as winner
        announceWinner(player, st.endTime);
      }
    }
    stopTimerIfNeeded();
  }

  function announceWinner(key, time) {
    if (winnerDeclared) return;
    winnerDeclared = true;
    const num = key === "p1" ? "1" : "2";
    winnerEl.textContent = `🎉 Player ${num} menang! (${time.toFixed(2)}s)`;
    message.textContent = `Permainan selesai — Player ${num} menang! Tekan "Mulai Baru" untuk bermain lagi.`;
    // stop both players
    state.p1.running = false;
    state.p2.running = false;
    // stop timer
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function announceTie(t) {
    if (winnerDeclared) return;
    winnerDeclared = true;
    winnerEl.textContent = `🤝 Seri! Kedua pemain selesai (${t.toFixed(2)}s)`;
    message.textContent =
      'Permainan berakhir seri. Tekan "Mulai Baru" untuk ulangi.';
    state.p1.running = false;
    state.p2.running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function newGame() {
    winnerDeclared = false;
    winnerEl.textContent = "";
    message.textContent = "Permainan dimulai! Susun angka secepat mungkin.";
    const n = parseInt(countSelect.value, 10);
    const numbers = randomNumbers(n);
    state.p1.pool = shuffle(numbers);
    state.p2.pool = shuffle(numbers);
    ["p1", "p2"].forEach((pl) => {
      state[pl].sorted = [];
      state[pl].penalty = 0;
      state[pl].start = Date.now();
      state[pl].running = true;
      state[pl].endTime = null;
    });
    // render
    renderPool("p1", p1Pool);
    renderPool("p2", p2Pool);
    p1Sorted.innerHTML = '<div class="placeholder">Area urut</div>';
    p2Sorted.innerHTML = '<div class="placeholder">Area urut</div>';
    p1Time.textContent = "0.0";
    p2Time.textContent = "0.0";
    p1Penalty.textContent = "0";
    p2Penalty.textContent = "0";
    updateNext("p1");
    updateNext("p2");
    startTimer();
  }

  // attach event
  newBtn.addEventListener("click", newGame);

  // initial state
  message.textContent = 'Siap! Pilih jumlah angka lalu tekan "Mulai Baru".';
})();
