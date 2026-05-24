/* ============================================================
   GRI ENGLISH — SAT R&W 8 GÜNLÜK KAMP — Feature Styles
   ============================================================
   Day dosyalarındaki indigo/teal renkleri var(--teal) ile kullanır.
   Gold (#9C7F45) marka rengi — kamp boyunca tutarlı.
   ============================================================ */

/* TOOLBAR */
.sc-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--line, #e5e7e5);
}
.sc-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  background: transparent;
  border: 1px solid var(--line, #e5e7e5);
  border-radius: 6px;
  font-family: var(--font-ui, 'Inter', sans-serif);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--ink-soft, #37534f);
  cursor: pointer;
  transition: all 0.15s ease;
}
.sc-tool-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.sc-tool-btn:hover {
  background: var(--twash, #f5f5f5);
  border-color: var(--teal, #2C5856);
  color: var(--teal, #2C5856);
}
.sc-tool-btn.active {
  background: var(--teal, #2C5856);
  color: #fff;
  border-color: var(--teal, #2C5856);
}
.sc-tool-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* MODAL OVERLAY */
.sc-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 31, 30, 0.55);
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.sc-modal-overlay[aria-hidden="false"] {
  opacity: 1;
  pointer-events: auto;
}

/* MODAL */
.sc-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.96);
  width: 90vw;
  max-width: 560px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(15, 31, 30, 0.25);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-ui, 'Inter', sans-serif);
}
.sc-modal[aria-hidden="false"] {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  pointer-events: auto;
}

.sc-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.3rem;
  border-bottom: 1px solid var(--line, #e5e7e5);
}
.sc-modal-head h3 {
  margin: 0;
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--ink, #0f1f1e);
}
.sc-modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--muted, #6b7975);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.sc-modal-close:hover {
  background: var(--twash, #f5f5f5);
  color: var(--ink, #0f1f1e);
}

.sc-modal-body {
  padding: 1.1rem 1.3rem 1.3rem;
  overflow-y: auto;
}

.sc-modal-label {
  display: block;
  margin-bottom: 1rem;
}
.sc-modal-label > span {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-soft, #37534f);
  margin-bottom: 0.4rem;
}
.sc-modal-label textarea,
.sc-modal-label select,
.sc-modal-label input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--line, #e5e7e5);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.92rem;
  color: var(--ink, #0f1f1e);
  background: #fff;
  resize: vertical;
}
.sc-modal-label textarea:focus,
.sc-modal-label select:focus,
.sc-modal-label input:focus {
  outline: none;
  border-color: var(--teal, #2C5856);
  box-shadow: 0 0 0 3px rgba(44, 88, 86, 0.12);
}

.sc-modal-note {
  font-size: 0.9rem;
  color: var(--muted, #6b7975);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.sc-modal-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
.sc-btn-ghost,
.sc-btn-primary {
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.sc-btn-ghost {
  background: transparent;
  border-color: var(--line, #e5e7e5);
  color: var(--ink-soft, #37534f);
}
.sc-btn-ghost:hover {
  background: var(--twash, #f5f5f5);
}
.sc-btn-primary {
  background: var(--teal, #2C5856);
  color: #fff;
}
.sc-btn-primary:hover {
  background: var(--tdark, #1a3d3b);
}
.sc-btn-primary:disabled,
.sc-btn-ghost:disabled {
  opacity: 0.6;
  cursor: wait;
}

.sc-modal-feedback {
  margin-top: 0.8rem;
  font-size: 0.85rem;
  min-height: 1.2em;
}
.sc-modal-feedback.success { color: #15803d; }
.sc-modal-feedback.error { color: #b91c1c; }

/* VOCAB LIST */
.sc-vocab-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.sc-vocab-item {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--line, #e5e7e5);
  border-radius: 8px;
  background: var(--twash, #fafaf7);
}
.sc-vocab-en {
  font-family: var(--font-ui, 'Inter', sans-serif);
  font-size: 0.95rem;
  color: var(--ink, #0f1f1e);
}
.sc-vocab-pos {
  font-style: italic;
  color: var(--muted, #6b7975);
  font-weight: 400;
  font-size: 0.85rem;
  margin-left: 0.3rem;
}
.sc-vocab-tr {
  font-family: var(--font-serif, 'Lora', Georgia, serif);
  font-size: 0.92rem;
  color: var(--ink-soft, #37534f);
  margin-top: 0.2rem;
  font-style: italic;
}

.sc-empty {
  text-align: center;
  color: var(--muted, #6b7975);
  font-style: italic;
  padding: 1.5rem;
  margin: 0;
}

/* ASK RESPONSE */
.sc-ask-bubble {
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  background: var(--twash, #fafaf7);
  border-left: 3px solid var(--teal, #2C5856);
  border-radius: 4px;
  font-family: var(--font-serif, 'Lora', Georgia, serif);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--ink, #0f1f1e);
}

/* COUNTER */
#scNoteCounter {
  font-weight: 400;
  color: var(--muted, #6b7975);
  font-size: 0.78rem;
}

/* BRAND HEADER/FOOTER WRAPPER */
.sc-brand-bar {
  background: #fcfaf3;
  border-bottom: 1px solid #ece8de;
  padding: 0.7rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.85rem;
}
.sc-brand-bar a {
  color: #2C5856;
  text-decoration: none;
  font-weight: 500;
}
.sc-brand-bar a:hover { color: #1a3d3b; }
.sc-brand-bar .sc-brand-logo {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
}
.sc-brand-bar .sc-brand-logo .it {
  font-style: italic;
  color: #2C5856;
}
.sc-brand-bar .sc-brand-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.78rem;
  color: #6b7975;
}
.sc-brand-bar .sc-brand-meta .sc-day-tag {
  background: #f4ecdb;
  color: #9C7F45;
  padding: 0.2rem 0.6rem;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .sc-brand-bar {
    padding: 0.6rem 1rem;
  }
  .sc-brand-bar .sc-brand-meta { font-size: 0.7rem; gap: 0.5rem; }
  .sc-toolbar { gap: 0.3rem; }
  .sc-tool-btn { padding: 0.3rem 0.55rem; font-size: 0.72rem; }
  .sc-tool-btn span { display: none; }
  .sc-modal { width: 94vw; }
  .sc-modal-head { padding: 0.8rem 1rem; }
  .sc-modal-body { padding: 0.9rem 1rem 1.1rem; }
}

/* Sözlük: Listeme Ekle butonu */
.sc-vocab-item {
  position: relative;
  padding: 0.85rem 1rem;
  padding-right: 7.5rem;
  background: var(--paper, #fff);
  border: 1px solid var(--line, #e5e7e5);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}
.sc-vocab-save {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--teal, #0d9488);
  color: #fff;
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-family: var(--font-ui, Inter), system-ui, sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.sc-vocab-save:hover { background: var(--tdark, #0b6b62); }
.sc-vocab-save:disabled { opacity: 0.6; cursor: not-allowed; }
.sc-vocab-save.saved {
  background: rgba(21,128,61,0.12);
  color: var(--correct, #15803d);
  cursor: default;
}
.sc-vocab-save.saved:hover { background: rgba(21,128,61,0.12); }

@media (max-width: 600px) {
  .sc-vocab-item { padding-right: 1rem; padding-bottom: 2.5rem; }
  .sc-vocab-save { position: static; transform: none; margin-top: 0.5rem; display: inline-block; }
}

/* Griye Sor — kota notu ve paket linkleri */
.sc-ask-quota {
  font-family: var(--font-ui, Inter), system-ui, sans-serif;
  font-size: 0.75rem;
  color: var(--muted, #6b7975);
  text-align: right;
  margin-top: 0.5rem;
  padding: 0.3rem 0.5rem;
  letter-spacing: 0.02em;
}
.sc-ask-packs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.sc-ask-pack {
  display: inline-block;
  padding: 0.5rem 0.85rem;
  background: var(--teal, #0d9488);
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-family: var(--font-ui, Inter), system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: background 0.15s;
}
.sc-ask-pack:hover { background: var(--tdark, #0b6b62); }
.sc-ask-empty { background: rgba(156,127,69,0.06); border-color: rgba(156,127,69,0.25); }

/* ============================================================
   ŞIK ELEME (option elimination)
   Sağ tık (desktop) veya basılı tutma (mobil) ile soru şıkkını
   üstü çizili göstermek için. Cevap seçilmiş şıklara uygulanmaz.
   ============================================================ */
.opt.eliminated:not(.sel) {
  text-decoration: line-through;
  opacity: 0.5;
  background: var(--bg-soft, #f5f3ec);
}
.opt.eliminated:not(.sel) .opt-letter {
  text-decoration: line-through;
  opacity: 0.7;
}
.opt.eliminated:not(.sel) span {
  text-decoration: line-through;
}

/* ============================================================
   ALTINI ÇİZME (highlight)
   Passage veya qstem içinde metin seçince beliren minik buton,
   tıklayınca sarı mark ile sarar. Mark'a tıklayınca silinir.
   Soru değişince innerHTML reset olduğu için otomatik temizlenir.
   ============================================================ */
mark.sc-hl {
  background: #fff59d;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.12s ease;
}
mark.sc-hl:hover {
  background: #ffeb3b;
}

#sc-hl-btn {
  position: absolute;
  z-index: 1000;
  display: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: var(--teal, #2C5856);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-family: var(--font-ui, Inter), system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  user-select: none;
  transition: transform 0.12s, box-shadow 0.12s, background 0.15s;
}
#sc-hl-btn svg {
  flex-shrink: 0;
}
#sc-hl-btn:hover {
  background: var(--tdark, #1A3D3B);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
}
