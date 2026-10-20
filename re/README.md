# re/ — analysis evidence (NOT part of the spec)

Strict clean-room implementers: do not read this directory.

- `img.py` loads `libil2cpp.so` (arm64) and applies RELATIVE relocations.
- `meta.py` parses IL2CPP `global-metadata.dat` (v29).
- `build_all.py` maps every assembly's method tokens to code addresses.
- `rev.py` disassembles with capstone and resolves metadata slots (strings/types/methods/call targets).
- `dump.txt` = per-method list of referenced strings/types and named callees for the game's own assemblies (names only, no code).

Paths are hardcoded to the session scratchpad (`.../scratchpad/x` = unzipped APK). Run after `unzip coloring-1-116.apk -d x`
and adjusting `SO`/`P`. Requires `capstone`, `lief`, `colorama`, `androguard`, `UnityPy`.
Addresses in the spec are virtual addresses in `lib/arm64-v8a/libil2cpp.so`.
