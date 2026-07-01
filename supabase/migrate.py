#!/usr/bin/env python
"""
รัน SQL migration เข้า Supabase Postgres โดยตรง (project-scoped ผ่าน connection string)
ใช้: python supabase/migrate.py <file.sql> [file2.sql ...]
อ่าน SUPABASE_DB_URL จาก .env.migrate (gitignored) หรือจาก environment
"""
import os
import sys
import pathlib

try:
    import psycopg
except ImportError:
    sys.exit("ต้องติดตั้งก่อน: pip install \"psycopg[binary]\"")

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_db_url():
    url = os.environ.get("SUPABASE_DB_URL", "").strip()
    if url:
        return url
    env = ROOT / ".env.migrate"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("SUPABASE_DB_URL="):
                return line.split("=", 1)[1].strip()
    return ""


def main():
    files = sys.argv[1:]
    if not files:
        sys.exit("ระบุไฟล์ .sql อย่างน้อย 1 ไฟล์")
    url = load_db_url()
    if not url:
        sys.exit("ไม่พบ SUPABASE_DB_URL (ใส่ใน .env.migrate)")

    with psycopg.connect(url, autocommit=True) as conn:
        for f in files:
            p = (ROOT / f) if not os.path.isabs(f) else pathlib.Path(f)
            sql = p.read_text(encoding="utf-8")
            with conn.cursor() as cur:
                cur.execute(sql)
            print(f"[OK] {f}")
    print("migration done")


if __name__ == "__main__":
    main()
