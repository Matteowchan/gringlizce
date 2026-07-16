#!/usr/bin/env python3
"""kelime.html'e vocab_answer izleme cagrisini ekler (idempotent)."""
f = "kelime.html"
h = open(f, encoding="utf-8").read()
if "vocab_answer" in h:
    print("Zaten ekli, atlandi."); raise SystemExit
anchor = "saveSet(LS_KEY_WRONG, wrongIds);"
if anchor not in h:
    print("HATA: cevap bloku bulunamadi, kelime.html beklenenden farkli."); raise SystemExit(1)
add = anchor + "\n\n  // merkezi izleme\n  if (window.logEvent) logEvent('vocab_answer', { word_id: w.id, word: (w.word || w.kelime || w.term || null), category: CATEGORY, correct: isCorrect });"
h = h.replace(anchor, add, 1)
open(f, "w", encoding="utf-8").write(h)
print("Eklendi: vocab_answer izleme cagrisi.")
