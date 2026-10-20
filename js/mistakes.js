// ===== Mistakes Module (personal build) =====
// Manual mistake entry: subject + question + correct solution + notes.
// Saving does two things:
//   1) adds a flashcard (front=question, back=solution+notes) to that
//      subject's "Mistakes" deck (created on demand inside the folder), and
//   2) files the question into the same deck's mistake notebook via
//      Decks.fileMistake, so the quiz "retake mistakes" flow picks it up.
// Filed as open-ended: retake grading uses the offline keyword fallback
// (Quiz.fallbackGrade) since AI grading is disabled.
const Mistakes = (() => {
  const SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Arabic', 'English'];
  let formEl = null;

  function init() { /* the Library header button opens the form; nothing to bind here */ }

  function openForm() {
    buildForm();
    formEl.querySelector('#mistake-subject').value = SUBJECTS[0];
    formEl.querySelector('#mistake-question').value = '';
    formEl.querySelector('#mistake-solution').value = '';
    formEl.querySelector('#mistake-notes').value = '';
    formEl.style.display = 'flex';
    setTimeout(() => formEl.querySelector('#mistake-question').focus(), 50);
  }

  function closeForm() {
    if (formEl) formEl.style.display = 'none';
  }

  function buildForm() {
    if (formEl) return;
    formEl = document.createElement('div');
    formEl.className = 'shortcuts-backdrop';
    formEl.style.display = 'none';
    // Reuses the flashcard editor's dialog styles — no new CSS.
    formEl.innerHTML = `
      <div class="shortcuts-card card-editor" role="dialog" aria-modal="true">
        <h3>Add mistake</h3>
        <label class="editor-label" for="mistake-subject">Subject</label>
        <select id="mistake-subject" class="editor-select">
          ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <label class="editor-label" for="mistake-question">Question you got stuck on</label>
        <textarea id="mistake-question" class="editor-textarea" rows="3"></textarea>
        <label class="editor-label" for="mistake-solution">Correct answer / solution</label>
        <textarea id="mistake-solution" class="editor-textarea" rows="3"></textarea>
        <label class="editor-label" for="mistake-notes">Notes (optional) — what tripped you up</label>
        <textarea id="mistake-notes" class="editor-textarea" rows="2"></textarea>
        <div class="editor-actions">
          <span class="editor-actions-spacer"></span>
          <button class="btn-ghost" id="mistake-cancel">Cancel</button>
          <button class="btn-primary" id="mistake-save">Save mistake</button>
        </div>
      </div>`;
    document.body.appendChild(formEl);
    formEl.addEventListener('click', e => { if (e.target === formEl) closeForm(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && formEl.style.display !== 'none') closeForm();
    });
    formEl.querySelector('#mistake-cancel').addEventListener('click', closeForm);
    formEl.querySelector('#mistake-save').addEventListener('click', save);
  }

  function ensureMistakesDeck(subject) {
    let deck = Decks.list().find(d => d.folder === subject && d.data && d.data.title === 'Mistakes');
    if (!deck) {
      deck = Decks.save(Parser.normalizeStudyData({ title: 'Mistakes', flashcards: [], quiz: [] }), '', null);
      Decks.setFolder(deck.id, subject);
      deck = Decks.get(deck.id);
    }
    return deck;
  }

  function save() {
    const subject = formEl.querySelector('#mistake-subject').value;
    const question = formEl.querySelector('#mistake-question').value.trim();
    const solution = formEl.querySelector('#mistake-solution').value.trim();
    const notes = formEl.querySelector('#mistake-notes').value.trim();
    if (!question || !solution) {
      if (typeof App !== 'undefined') App.showToast('Question and solution are required', 'error');
      return;
    }
    const prevActive = Decks.getActive();
    const deck = ensureMistakesDeck(subject);
    // 1) Review flashcard.
    const cards = deck.data.flashcards;
    const maxId = cards.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
    cards.push({
      id: maxId + 1,
      front: question,
      back: notes ? solution + '\n\nNotes: ' + notes : solution,
      difficulty: 'medium',
      category: 'Mistakes'
    });
    // 2) Mistake-notebook entry for the retake flow.
    Decks.fileMistake(deck.id, {
      type: 'open-ended',
      question,
      correctAnswer: solution,
      keyPoints: notes ? [notes] : [],
      explanation: notes
    });
    Decks.touch(deck.id);
    if (prevActive) Decks.setActive(prevActive.id);
    closeForm();
    if (typeof App !== 'undefined') App.showToast('Mistake saved — review card added', 'success');
    if (typeof Library !== 'undefined') Library.render();
  }

  return { init, openForm };
})();
