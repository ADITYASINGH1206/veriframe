"""Utility script to reset the database and clear all cached test files before an expo/demo presentation."""

import os
import shutil
import sqlite3
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "test_dev.db"

def clear_all():
    print("Clearing database history...")
    if DB_PATH.exists():
        try:
            con = sqlite3.connect(DB_PATH)
            cur = con.cursor()
            cur.execute("PRAGMA foreign_keys = OFF;")
            for table in ["reviews", "tracks", "analyses", "media", "audit_log"]:
                try:
                    cur.execute(f"DELETE FROM {table};")
                    print(f"  Cleared table: {table}")
                except sqlite3.OperationalError:
                    pass
            con.commit()
            con.close()
            print("Database is clean.")
        except Exception as e:
            print(f"Database error: {e}")

    print("Cleaning temporary evidence and cache files...")
    td = tempfile.gettempdir()
    for folder in ["sv_evidence", "sentinel_v_preprocessed"]:
        target_dir = os.path.join(td, folder)
        if os.path.exists(target_dir):
            try:
                shutil.rmtree(target_dir, ignore_errors=True)
                print(f"  Removed {folder}")
            except Exception as e:
                print(f"  Could not remove {folder}: {e}")

    removed_files = 0
    try:
        for f in os.listdir(td):
            if f.startswith("an_"):
                try:
                    os.remove(os.path.join(td, f))
                    removed_files += 1
                except Exception:
                    pass
    except Exception:
        pass
    print(f"  Removed {removed_files} temporary analysis file(s).")
    print("\nVeriFrame is reset and ready for a fresh presentation!")

if __name__ == "__main__":
    clear_all()
