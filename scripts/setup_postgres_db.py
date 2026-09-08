import psycopg2
import sys

def main():
    passwords = ['postgres', 'password', 'admin', 'root', '123456', 'cybertracepass', '']
    connected_pass = None
    
    for p in passwords:
        try:
            conn = psycopg2.connect(dbname='postgres', user='postgres', password=p, host='127.0.0.1', port=5432)
            connected_pass = p
            print(f"PostgreSQL Connection Successful! Password: '{p}'")
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM pg_database WHERE datname='cybertrace'")
            if not cur.fetchone():
                cur.execute("CREATE DATABASE cybertrace")
                print("Created database 'cybertrace'")
            else:
                print("Database 'cybertrace' already exists")
            conn.close()
            return True, p
        except Exception as e:
            pass

    print("Could not connect with common passwords.")
    return False, None

if __name__ == '__main__':
    main()
