"""Independent package reader using Python's standard ZIP implementation."""

import hashlib
import json
import pathlib
import sys
import zipfile

if not __debug__:
    raise RuntimeError("Run package verification without Python optimization")

root = pathlib.Path.cwd()
folder = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "output/release")
version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]
source_path = folder / f"password-generator-v{version}-source.zip"
offline_path = folder / f"password-generator-v{version}-offline.zip"
site_path = folder / f"password-generator-v{version}-site.zip"
totals = {}
for archive_path in (source_path, offline_path, site_path):
    with zipfile.ZipFile(archive_path) as archive:
        assert archive.testzip() is None, "CRC validation failed"
        names = archive.namelist()
        assert names == sorted(set(names)), "Duplicate or unordered entries"
        for item in archive.infolist():
            name = pathlib.PurePosixPath(item.filename)
            assert not name.is_absolute() and ".." not in name.parts
            assert item.date_time == (1980, 1, 1, 0, 0, 0)
            assert item.compress_type == zipfile.ZIP_STORED
            actual = archive.read(item)
            if archive_path == source_path:
                expected = root / item.filename
            elif archive_path == site_path:
                expected = root / "dist" / item.filename
            elif item.filename in ("vi.html", "en.html"):
                expected = root / "dist/offline" / item.filename
            elif item.filename == "build-record.json":
                expected = root / "dist/build-record.json"
            elif item.filename == "fonts/OFL.txt":
                expected = root / "assets/fonts/OFL.txt"
            elif item.filename == "VERIFY.md":
                assert f"v{version}-source.zip" in actual.decode("utf-8")
                continue
            else:
                expected = root / item.filename
            assert actual == expected.read_bytes(), f"Content mismatch {item.filename}"
        if archive_path == source_path:
            for name in (
                "src/random.ts", "src/password.ts", "src/phrase.ts",
                "data/lists/eff-long.txt", "data/lists/experimental-agent-vi.txt",
                "data/lists/experimental-agent-ascii.txt", "docs/ALGORITHMS.md",
                "scripts/build.ts", "scripts/package.ts", "package-lock.json",
                "licenses/GPL-3.0-or-later.txt", "assets/fonts/OFL.txt",
                "public/licenses/NOTICE.txt", ".vinasig/manifest.json",
            ):
                assert name in names, f"Missing source entry {name}"
        elif archive_path == offline_path:
            assert "licenses/LGPL-3.0-or-later.txt" in names
            assert "fonts/OFL.txt" in names
        else:
            record = json.loads((root / "dist/build-record.json").read_text(encoding="utf-8"))
            assert set(names) == set(record["artifacts"]) | {"build-record.json"}
            assert "_headers" in names and "index.html" in names and "en/index.html" in names
            for name, expected in record["artifacts"].items():
                assert hashlib.sha256(archive.read(name)).hexdigest() == expected["sha256"]
        totals[archive_path.name] = len(names)
covered = set()
for line in (folder / "SHA256SUMS.txt").read_text(encoding="utf-8").splitlines():
    digest, name = line.split("  ")
    assert pathlib.PurePath(name).name == name and name not in covered
    assert hashlib.sha256((folder / name).read_bytes()).hexdigest() == digest
    covered.add(name)
assert covered == {entry.name for entry in folder.iterdir() if entry.name != "SHA256SUMS.txt"}
print(json.dumps({"status": "PASS", "oracle": "Python stdlib zipfile", "entries": totals}))
