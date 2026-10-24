import sqlite3
import os

def migrate_professional_profiles():
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "sehatsetu.db")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    existing_cols = [col[1] for col in cursor.execute("PRAGMA table_info(professional_profiles)").fetchall()]
    cols_to_add = [
        ("gender", "VARCHAR(20) DEFAULT 'Any'"),
        ("languages", "VARCHAR(255) DEFAULT 'English, Hindi'"),
        ("teleconsultation_available", "BOOLEAN DEFAULT 1"),
        ("in_person_available", "BOOLEAN DEFAULT 1"),
        ("is_sample", "BOOLEAN DEFAULT 1"),
        ("rating", "FLOAT"),
        ("review_count", "INTEGER DEFAULT 0"),
        ("avatar_seed", "VARCHAR(50)"),
        ("services_offered", "TEXT")
    ]
    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE professional_profiles ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
    conn.commit()
    conn.close()
    print("Schema migration check completed successfully.")

def migrate_patient_profiles():
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "sehatsetu.db")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    existing_cols = [col[1] for col in cursor.execute("PRAGMA table_info(patient_profiles)").fetchall()]
    cols_to_add = [
        ("state", "VARCHAR(100) DEFAULT 'Haryana'"),
        ("pincode", "VARCHAR(20) DEFAULT '131001'"),
        ("is_aadhaar_verified", "BOOLEAN DEFAULT 0"),
        ("masked_aadhaar", "VARCHAR(20)"),
        ("aadhaar_verified_at", "DATETIME"),
        ("abha_number", "VARCHAR(30)"),
        ("abha_address", "VARCHAR(100)"),
    ]
    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE patient_profiles ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to patient_profiles")
    conn.commit()
    conn.close()
    print("Patient profiles schema migration check completed successfully.")

def run_migrations():
    migrate_professional_profiles()
    migrate_patient_profiles()

if __name__ == "__main__":
    run_migrations()
