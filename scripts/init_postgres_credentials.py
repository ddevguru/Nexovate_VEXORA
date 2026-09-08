import re
import os
import subprocess
import psycopg2

pg_hba_path = r"C:\Program Files\PostgreSQL\18\data\pg_hba.conf"

def main():
    if not os.path.exists(pg_hba_path):
        print(f"pg_hba.conf not found at {pg_hba_path}")
        return

    with open(pg_hba_path, "r") as f:
        content = f.read()

    # Replace scram-sha-256 with trust for 127.0.0.1
    modified = re.sub(
        r'(host\s+all\s+all\s+127\.0\.0\.1/32\s+)scram-sha-256',
        r'\1trust',
        content
    )
    modified = re.sub(
        r'(host\s+all\s+all\s+::1/128\s+)scram-sha-256',
        r'\1trust',
        modified
    )

    with open(pg_hba_path, "w") as f:
        f.write(modified)

    print("Updated pg_hba.conf to trust mode.")
    
    # Restart postgres service via PowerShell
    subprocess.run(["powershell", "-Command", "Restart-Service postgresql-x64-18"], check=True)
    print("Restarted PostgreSQL service.")

    # Connect with trust
    conn = psycopg2.connect(dbname="postgres", user="postgres", host="127.0.0.1", port=5432)
    conn.autocommit = True
    cur = conn.cursor()

    # Alter password to cybertracepass
    cur.execute("ALTER USER postgres WITH PASSWORD 'cybertracepass';")
    print("Updated postgres user password to 'cybertracepass'")

    # Create cybertrace database
    cur.execute("SELECT 1 FROM pg_database WHERE datname='cybertrace'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE cybertrace;")
        print("Created database 'cybertrace'")
    else:
        print("Database 'cybertrace' already exists.")

    conn.close()

    # Revert pg_hba.conf to scram-sha-256
    with open(pg_hba_path, "w") as f:
        f.write(content)

    subprocess.run(["powershell", "-Command", "Restart-Service postgresql-x64-18"], check=True)
    print("Reverted pg_hba.conf to scram-sha-256 and restarted service.")

if __name__ == '__main__':
    main()
